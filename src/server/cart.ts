import { mayPlaceOrders } from "./purchase-permission";
import "server-only";
import { randomUUID } from "node:crypto";
import { Cookie, CookieJar } from "tough-cookie";
import { z } from "zod";
import {
  preparationInput,
  cartDifference,
  type CheckedLine,
  type Preparation,
} from "../domain/cart";
import { buyerHeaders } from "./buyer-headers";
import type { PortalSession } from "./session-store";
import { PortalError } from "./security";

const origin = "https://volvoemea.vtexcommercestable.com.br";
const value = z.object({ value: z.string() }).optional();
const contextSchema = z.object({
  namespaces: z.object({
    authentication: z.object({ storeUserId: value }),
    store: z.object({
      channel: value,
      countryCode: value,
      currencyCode: value,
    }),
  }),
});
const skuSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  referenceId: z.array(z.object({ Value: z.string() })).optional(),
  sellers: z.array(
    z.object({ sellerId: z.string(), sellerDefault: z.boolean().optional() }),
  ),
});
const productsSchema = z.array(z.object({ items: z.array(skuSchema) }));
const itemSchema = z.object({
  id: z.string(),
  seller: z.string(),
  quantity: z.number().int().nonnegative(),
});
const formSchema = z.object({
  orderFormId: z.string().regex(/^[a-zA-Z0-9-]+$/),
  items: z.array(itemSchema),
});
const simulationSchema = z.object({
  items: z.array(
    itemSchema.extend({
      availability: z.string(),
      sellingPrice: z.number().int().nonnegative().nullable(),
      price: z.number().int().nonnegative().nullable(),
    }),
  ),
});

export async function checkoutRequest<T>(
  session: PortalSession,
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
): Promise<T> {
  if (session.context.mode !== "vtex" || !session.upstreamCookies)
    throw new PortalError(
      401,
      "LIVE_REQUIRED",
      "Sign in with VTEX to check prices and stock.",
    );
  const jar = session.checkoutCookies
    ? CookieJar.deserializeSync(session.checkoutCookies)
    : new CookieJar();
  const url = origin + path;
  if (!session.checkoutCookies)
    for (const part of session.upstreamCookies.split(";"))
      await jar.setCookie(`${part.trim()}; Path=/`, origin);
  let response: Response;
  try {
    response = await fetch(url, {
      method:
        body === undefined
          ? "GET"
          : path.startsWith("/api/sessions?") &&
              (await jar.getCookies(url)).some(
                (cookie) => cookie.key === "vtex_session",
              )
            ? "PATCH"
            : "POST",
      headers: {
        ...buyerHeaders(await jar.getCookieString(url)),
        "Content-Type": "application/json",
        "X-FORWARDED-HOST": "www.emeafaststore.com",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new PortalError(
      502,
      "CART_UNAVAILABLE",
      "The cart service could not be reached. No automatic retry was made.",
    );
  }
  for (const rawCookie of response.headers.getSetCookie()) {
    const cookie = Cookie.parse(rawCookie);
    if (!cookie) continue;
    // X-FORWARDED-HOST can scope VTEX cookies to the storefront. This isolated
    // server-side jar is used exclusively with the fixed VTEX backend origin.
    if (
      cookie.domain === "www.emeafaststore.com" ||
      cookie.domain === "emeafaststore.com"
    ) {
      cookie.domain = new URL(origin).hostname;
      cookie.hostOnly = true;
    }
    await jar.setCookie(cookie, url);
  }
  session.checkoutCookies = JSON.stringify(jar.serializeSync());
  if (!response.ok)
    throw new PortalError(
      response.status === 401 || response.status === 403 ? 403 : 502,
      "CART_UNAVAILABLE",
      `VTEX could not complete this operation (HTTP ${response.status}).`,
    );
  const payload: unknown = await response.json().catch(() => {
    throw new PortalError(
      502,
      "CART_RESPONSE",
      "VTEX returned a non-JSON response.",
    );
  });
  const parsed = schema.safeParse(payload);
  if (!parsed.success)
    throw new PortalError(
      502,
      "CART_FORMAT",
      "VTEX returned an unexpected cart response.",
    );
  return parsed.data;
}

// All calls for one local session are serialized; concurrent clicks cannot reuse a snapshot.
export async function cartOperation<T>(
  session: PortalSession,
  action: () => Promise<T>,
): Promise<T> {
  if (session.cartBusy)
    throw new PortalError(
      409,
      "CART_BUSY",
      "A cart operation is already running.",
    );
  session.cartBusy = true;
  try {
    return await action();
  } finally {
    session.cartBusy = false;
  }
}

export async function prepareCart(
  session: PortalSession,
  input: unknown,
): Promise<Preparation> {
  const { lines } = preparationInput.parse(input);
  session.preparation = undefined;
  const context = await checkoutRequest(
    session,
    "/api/sessions?items=authentication.storeUserId,store.channel,store.countryCode,store.currencyCode",
    contextSchema,
    {},
  );
  const store = context.namespaces.store;
  if (
    context.namespaces.authentication.storeUserId?.value !==
    session.context.user.id
  )
    throw new PortalError(
      403,
      "CART_IDENTITY",
      "The buyer context could not be confirmed.",
    );
  const channel = store.channel?.value,
    country = store.countryCode?.value,
    currency = store.currencyCode?.value;
  if (!channel || !country || !currency || !/^[A-Z]{3}$/.test(currency))
    throw new PortalError(
      502,
      "CART_CONTEXT",
      "The sales channel, country or currency is missing from the buyer session.",
    );
  const resolved: CheckedLine[] = [];
  // Resolve exact identifiers only; fuzzy search results are never silently selected.
  for (const line of lines) {
    const params = new URLSearchParams({ sc: channel, _from: "0", _to: "49" });
    if (/^\d+$/.test(line.sku)) params.set("fq", `skuId:${line.sku}`);
    else params.set("ft", line.sku);
    let products = await checkoutRequest(
      session,
      `/api/catalog_system/pub/products/search?${params}`,
      productsSchema,
    );
    let candidates = products
      .flatMap((p) => p.items)
      .filter(
        (s) =>
          s.itemId === line.sku ||
          s.referenceId?.some((r) => r.Value === line.sku),
      );
    if (!candidates.length && /^\d+$/.test(line.sku)) {
      params.delete("fq");
      params.set("ft", line.sku);
      products = await checkoutRequest(
        session,
        `/api/catalog_system/pub/products/search?${params}`,
        productsSchema,
      );
      candidates = products
        .flatMap((p) => p.items)
        .filter((s) => s.referenceId?.some((r) => r.Value === line.sku));
    }
    candidates = [...new Map(candidates.map((s) => [s.itemId, s])).values()];
    const sku = candidates.length === 1 ? candidates[0] : undefined;
    const seller =
      sku?.sellers.find((s) => s.sellerDefault) ||
      (sku?.sellers.length === 1 ? sku.sellers[0] : undefined);
    resolved.push({
      reference: line.sku,
      sku: sku?.itemId || null,
      name: sku?.name || line.sku,
      seller: seller?.sellerId || null,
      requested: line.quantity,
      available: 0,
      price: null,
      issue: !sku
        ? "Reference not found or ambiguous."
        : !seller
          ? "A seller could not be selected."
          : null,
    });
  }
  // Merge references resolving to the same SKU and seller before simulation or transfer.
  const merged: CheckedLine[] = [];
  for (const line of resolved) {
    const existing =
      line.sku && line.seller
        ? merged.find((i) => i.sku === line.sku && i.seller === line.seller)
        : undefined;
    if (existing) {
      existing.requested += line.requested;
      existing.reference += `, ${line.reference}`;
    } else merged.push({ ...line });
  }
  const valid = merged.filter((line) => !line.issue);
  if (valid.some((line) => line.requested > 9999))
    throw new PortalError(
      400,
      "QUANTITY_LIMIT",
      "Combined quantity for a SKU exceeds 9999.",
    );
  for (let start = 0; start < valid.length; start += 50) {
    const batch = valid.slice(start, start + 50);
    const simulated = await checkoutRequest(
      session,
      `/api/checkout/pub/orderForms/simulation?sc=${encodeURIComponent(channel)}`,
      simulationSchema,
      {
        country,
        items: batch.map((line) => ({
          id: line.sku,
          seller: line.seller,
          quantity: line.requested,
        })),
      },
    );
    for (const line of batch) {
      const item = simulated.items.find(
        (item) => item.id === line.sku && item.seller === line.seller,
      );
      line.available = item?.availability === "available" ? item.quantity : 0;
      line.price = item?.sellingPrice ?? item?.price ?? null;
      line.issue = !item
        ? "SKU not returned by VTEX."
        : item.availability !== "available"
          ? `Unavailable: ${item.availability}`
          : line.price === null
            ? "No price in this buyer context."
            : line.available < line.requested
              ? `Only ${line.available} units accepted by simulation.`
              : null;
    }
  }
  let authorized = false;
  let permissionIssue: string | null = null;
  try {
    authorized = await mayPlaceOrders(session);
  } catch (error) {
    if (!(error instanceof PortalError)) throw error;
    permissionIssue = error.message;
  }
  const preparation: Preparation = {
    id: randomUUID(),
    expiresAt: Date.now() + 5 * 60_000,
    currency,
    lines: merged,
    canTransfer: authorized && merged.every((line) => !line.issue),
    transferBlock: !authorized
      ? permissionIssue ||
        "VTEX does not grant this account permission to place orders."
      : merged.some((line) => line.issue)
        ? "Resolve the flagged lines before transferring."
        : null,
  };
  session.preparation = {
    ...preparation,
    channel,
    unitId: session.context.unit.id,
  };
  return preparation;
}

export async function transferCart(session: PortalSession, id: string) {
  const saved = session.preparation;
  if (
    !saved ||
    saved.id !== id ||
    saved.expiresAt < Date.now() ||
    saved.unitId !== session.context.unit.id ||
    !saved.canTransfer
  )
    throw new PortalError(
      409,
      "PREPARATION_EXPIRED",
      "Check your parts list again before transferring.",
    );
  if (!(await mayPlaceOrders(session)))
    throw new PortalError(
      403,
      "PURCHASE_DENIED",
      "VTEX does not grant this account permission to place orders.",
    );
  // Consume before the first write. An uncertain network result must not cause a duplicate retry.
  session.preparation = undefined;
  const before = await checkoutRequest(
    session,
    session.orderFormId
      ? `/api/checkout/pub/orderForm/${session.orderFormId}`
      : `/api/checkout/pub/orderForm?sc=${encodeURIComponent(saved.channel)}`,
    formSchema,
  );
  if (session.orderFormId && before.orderFormId !== session.orderFormId)
    throw new PortalError(
      409,
      "CART_CHANGED",
      "The cart has changed. Check your parts list again.",
    );
  session.orderFormId = before.orderFormId;
  const items = saved.lines.map((line) => ({
    id: line.sku!,
    seller: line.seller!,
    quantity: line.requested,
  }));
  const after = await checkoutRequest(
    session,
    `/api/checkout/pub/orderForm/${before.orderFormId}/items`,
    formSchema,
    { orderItems: items },
  );
  if (after.orderFormId !== before.orderFormId)
    throw new PortalError(
      502,
      "CART_CHANGED",
      "The cart response could not be confirmed. Do not repeat the transfer before reviewing your cart.",
    );
  return cartDifference(items, before.items, after.items);
}

export async function readPortalCart(session: PortalSession) {
  if (session.context.mode !== "vtex")
    throw new PortalError(
      401,
      "LIVE_REQUIRED",
      "Sign in with VTEX to view the cart.",
    );
  if (!session.orderFormId) return { items: [] };
  const form = await checkoutRequest(
    session,
    `/api/checkout/pub/orderForm/${session.orderFormId}`,
    formSchema,
  );
  if (form.orderFormId !== session.orderFormId)
    throw new PortalError(
      502,
      "CART_CHANGED",
      "The cart response could not be confirmed.",
    );
  return { items: form.items };
}

export async function checkoutHandoff(session: PortalSession) {
  if (!(await mayPlaceOrders(session)))
    throw new PortalError(
      403,
      "PURCHASE_DENIED",
      "VTEX does not grant this account permission to place orders.",
    );
  const cart = await readPortalCart(session);
  if (!session.orderFormId || !cart.items.some((item) => item.quantity > 0))
    throw new PortalError(
      409,
      "CART_EMPTY",
      "Add items to your portal cart first.",
    );
  // Same local-development handoff as FastStore redirectToCheckout; no auth or
  // ownership cookie is copied into a URL. The hosted checkout handles sign-in.
  const url = new URL("https://www.emeafaststore.com/checkout");
  url.searchParams.set("orderFormId", session.orderFormId);
  return { url: url.toString() };
}
