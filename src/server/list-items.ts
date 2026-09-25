import "server-only";
import { z } from "zod";
import { draftLineSchema } from "../domain/order-draft";
import { orderIdSchema } from "../domain/order";
import { checkoutRequest } from "./cart";
import { getBuyerOrder } from "./account";
import { getBuyerLists, getBuyerListItems, listQuery } from "./lists";
import type { PortalSession } from "./session-store";
import { PortalError } from "./security";
const inputSchema = z
  .object({
    listId: z.string().regex(/^[A-Za-z0-9-]{1,80}$/),
    lines: z.array(draftLineSchema).min(1).max(200).optional(),
    orderId: orderIdSchema.optional(),
  })
  .strict()
  .refine((x) => Boolean(x.lines) !== Boolean(x.orderId));
const catalogSchema = z.array(
  z.object({
    productId: z.string(),
    items: z.array(
      z.object({
        itemId: z.string(),
        referenceId: z.array(z.object({ Value: z.string() })).optional(),
      }),
    ),
  }),
);
const returnedItem = z.object({
  id: z.string(),
  skuId: z.string(),
  preferredQuantity: z.number().int(),
});
const provider = '@context(provider: "vtex.replenishment-service@1.x")';
async function resolve(session: PortalSession, reference: string) {
  const search = async (filter: string) =>
    checkoutRequest(
      session,
      `/api/catalog_system/pub/products/search?${filter}&_from=0&_to=49`,
      catalogSchema,
    );
  let products = /^\d+$/.test(reference)
    ? await search(`fq=${encodeURIComponent(`skuId:${reference}`)}`)
    : await search(`ft=${encodeURIComponent(reference)}`);
  let matches = products.flatMap((p) =>
    p.items
      .filter(
        (s) =>
          s.itemId === reference ||
          s.referenceId?.some((r) => r.Value === reference),
      )
      .map((s) => ({ skuId: s.itemId, productId: p.productId })),
  );
  if (!matches.length && /^\d+$/.test(reference)) {
    products = await search(`ft=${encodeURIComponent(reference)}`);
    matches = products.flatMap((p) =>
      p.items
        .filter((s) => s.referenceId?.some((r) => r.Value === reference))
        .map((s) => ({ skuId: s.itemId, productId: p.productId })),
    );
  }
  const unique = [...new Map(matches.map((m) => [m.skuId, m])).values()];
  if (unique.length !== 1)
    throw new PortalError(
      409,
      "LIST_REFERENCE",
      `Reference ${reference} could not be resolved uniquely. No list items were written.`,
    );
  return unique[0];
}
export async function populateBuyerList(session: PortalSession, body: unknown) {
  const input = inputSchema.parse(body);
  const target = (await getBuyerLists(session)).find(
    (l) => l.id === input.listId && l.status === "active",
  );
  if (!target)
    throw new PortalError(
      403,
      "LIST_DENIED",
      "Select an active list available to your account.",
    );
  const source = input.orderId
    ? (await getBuyerOrder(session, input.orderId)).items.map((i) => ({
        sku: i.id,
        quantity: i.quantity,
      }))
    : input.lines!;
  if (source.length > 200)
    throw new PortalError(
      400,
      "LIST_TOO_LARGE",
      "Prepare at most 200 lines at a time.",
    );
  const deadline = Date.now() + 80000;
  const resolved = new Map<
    string,
    { skuId: string; productId: string; preferredQuantity: number }
  >();
  for (const line of source) {
    if (Date.now() > deadline)
      throw new PortalError(
        409,
        "LIST_TIMEOUT",
        "Resolution took too long. No list items were written. Use a smaller preparation.",
      );
    const item = await resolve(session, line.sku);
    const quantity =
      (resolved.get(item.skuId)?.preferredQuantity || 0) + line.quantity;
    if (quantity > 9999)
      throw new PortalError(
        400,
        "LIST_QUANTITY",
        "Combined quantity exceeds 9999. No list items were written.",
      );
    resolved.set(item.skuId, { ...item, preferredQuantity: quantity });
  }
  const existing = await getBuyerListItems(session, input.listId);
  if (new Set(existing.map((i) => i.skuId)).size !== existing.length)
    throw new PortalError(
      409,
      "LIST_DUPLICATES",
      "This list has duplicate SKUs. Review it before adding items.",
    );
  const items = [...resolved.values()];
  for (const item of items) {
    item.preferredQuantity +=
      existing.find((i) => i.skuId === item.skuId)?.preferredQuantity || 0;
    if (item.preferredQuantity > 9999)
      throw new PortalError(
        400,
        "LIST_QUANTITY",
        "The resulting list quantity exceeds 9999. No list items were written.",
      );
  }
  let completed = 0;
  try {
    for (const item of items) {
      if (Date.now() > deadline) throw new Error("deadline");
      const old = existing.find((i) => i.skuId === item.skuId);
      const result = old
        ? (
            await listQuery(
              session,
              `mutation PortalUpdateListItem($listId: ID!, $itemId: ID!, $input: UpdateItemInput!) { updateListItem(listId: $listId, itemId: $itemId, input: $input) ${provider} { id skuId preferredQuantity } }`,
              z.object({ updateListItem: returnedItem }),
              {
                listId: input.listId,
                itemId: old.id,
                input: { preferredQuantity: item.preferredQuantity },
              },
            )
          ).updateListItem
        : (
            await listQuery(
              session,
              `mutation PortalAddListItem($listId: ID!, $input: AddItemInput!) { addListItem(listId: $listId, input: $input) ${provider} { id skuId preferredQuantity } }`,
              z.object({ addListItem: returnedItem }),
              { listId: input.listId, input: item },
            )
          ).addListItem;
      if (
        result.skuId !== item.skuId ||
        result.preferredQuantity !== item.preferredQuantity
      )
        throw new Error("mismatch");
      completed++;
    }
    const saved = await getBuyerListItems(session, input.listId);
    if (
      items.some(
        (i) =>
          saved.find((s) => s.skuId === i.skuId)?.preferredQuantity !==
          i.preferredQuantity,
      )
    )
      throw new Error("readback mismatch");
    return {
      complete: true,
      completed,
      total: items.length,
      listId: input.listId,
    };
  } catch {
    return {
      complete: false,
      completed,
      total: items.length,
      listId: input.listId,
      message:
        "Some changes may already be saved. Review this list before trying again; no automatic retry was made.",
    };
  }
}
