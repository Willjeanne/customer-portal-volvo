import "server-only";
import { z } from "zod";
import {
  compareOfferInput,
  includedOrder,
  insightPeriodSchema,
  periodStart,
  summarizePurchases,
  type InsightOrder,
  type OfferComparison,
  type SimulatedOffer,
} from "@/domain/insights";
import { getBuyerInsightOrder, listBuyerOrders } from "./account";
import { checkoutRequest } from "./cart";
import { PortalError } from "./security";
import type { PortalSession } from "./session-store";

export async function readPurchasingInsights(
  session: PortalSession,
  periodInput: unknown,
) {
  const period = insightPeriodSchema.parse(periodInput);
  const now = Date.now(),
    since = periodStart(period, now);
  const rows = new Map<
    string,
    { orderId: string; creationDate: string; status: string }
  >();
  let total = 0;
  // Bounded buyer-scoped history. Never call an administrative OMS search.
  for (let page = 1; page <= 3; page++) {
    const data = await listBuyerOrders(session, page);
    total = data.paging.total;
    for (const row of data.list) rows.set(row.orderId, row);
    if (page >= data.paging.pages || !data.list.length) break;
  }
  const eligible = [...rows.values()].filter((row) =>
    includedOrder(row, since, now),
  );
  const orders: InsightOrder[] = [];
  const failed: string[] = [];
  for (let i = 0; i < eligible.length; i += 5) {
    const batch = eligible.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map((row) => getBuyerInsightOrder(session, row.orderId)),
    );
    results.forEach((r, index) => {
      if (r.status === "fulfilled") {
        if (includedOrder(r.value, since, now)) orders.push(r.value);
      } else failed.push(batch[index].orderId);
    });
  }
  return {
    ...summarizePurchases(orders),
    period,
    updatedAt: new Date(now).toISOString(),
    scope: { user: session.context.user.name, unit: session.context.unit.name },
    coverage: {
      scanned: rows.size,
      totalAccessible: total,
      analyzed: orders.length,
      failed: failed.length,
      truncated: rows.size < total,
    },
  };
}
const field = z.object({ value: z.string() }).optional();
const contextSchema = z.object({
  namespaces: z.object({
    authentication: z.object({ storeUserId: field }),
    store: z.object({
      channel: field,
      countryCode: field,
      currencyCode: field,
    }),
  }),
});
const simulationSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      seller: z.string(),
      quantity: z.number().int().nonnegative(),
      availability: z.string(),
      sellingPrice: z.number().int().nonnegative().nullable(),
      priceDefinition: z
        .object({ total: z.number().int().nonnegative() })
        .nullish(),
      priceTags: z
        .array(
          z.object({ identifier: z.string().nullish(), value: z.number() }),
        )
        .nullish(),
    }),
  ),
  ratesAndBenefitsData: z
    .object({
      rateAndBenefitsIdentifiers: z
        .array(z.object({ id: z.string(), name: z.string().nullish() }))
        .nullish(),
    })
    .nullish(),
});
export async function comparePurchasedOffers(
  session: PortalSession,
  input: unknown,
): Promise<OfferComparison> {
  const data = compareOfferInput.parse(input);
  const order = await getBuyerInsightOrder(session, data.orderId);
  const item = order.items[data.index];
  if (!item?.seller)
    throw new PortalError(
      409,
      "INSIGHT_SELLER",
      "The original seller is unavailable. Find this part in the catalogue instead.",
    );
  const context = await checkoutRequest(
    session,
    "/api/sessions?items=authentication.storeUserId,store.channel,store.countryCode,store.currencyCode",
    contextSchema,
    {},
  );
  if (
    context.namespaces.authentication.storeUserId?.value !==
    session.context.user.id
  )
    throw new PortalError(
      403,
      "INSIGHT_IDENTITY",
      "The buyer context could not be confirmed.",
    );
  const store = context.namespaces.store;
  if (
    !store.channel?.value ||
    !store.countryCode?.value ||
    !store.currencyCode?.value ||
    !/^[A-Z]{3}$/.test(store.currencyCode.value)
  )
    throw new PortalError(
      502,
      "INSIGHT_CONTEXT",
      "Your buying context is incomplete.",
    );
  const offers: SimulatedOffer[] = [];
  for (const quantity of [
    ...new Set([
      data.quantity,
      ...(data.compareQuantity ? [data.compareQuantity] : []),
    ]),
  ]) {
    const result = await checkoutRequest(
      session,
      `/api/checkout/pub/orderForms/simulation?sc=${encodeURIComponent(store.channel.value)}`,
      simulationSchema,
      {
        country: store.countryCode.value,
        items: [{ id: item.id, seller: item.seller, quantity }],
      },
    );
    const match = result.items.find(
      (i) => i.id === item.id && i.seller === item.seller,
    );
    const available =
      !!match &&
      match.availability === "available" &&
      match.quantity === quantity;
    const total =
      available && match.sellingPrice !== null
        ? (match.priceDefinition?.total ?? match.sellingPrice * quantity)
        : null;
    const identifiers = new Set(
      (match?.priceTags || [])
        .filter((t) => t.value < 0)
        .map((t) => t.identifier),
    );
    offers.push({
      quantity,
      accepted: match?.quantity || 0,
      available,
      total,
      unitPrice: total === null ? null : total / quantity,
      benefits: (result.ratesAndBenefitsData?.rateAndBenefitsIdentifiers || [])
        .filter((b) => identifiers.has(b.id))
        .map((b) => b.name || b.id),
    });
  }
  return {
    sku: item.id,
    seller: item.seller,
    currency: store.currencyCode.value,
    checkedAt: new Date().toISOString(),
    historicalUnitPrice:
      order.storePreferencesData?.currencyCode === store.currencyCode.value
        ? (item.priceDefinition?.total ?? item.sellingPrice * item.quantity) /
          item.quantity
        : null,
    offers,
  };
}

const productSchema = z.array(
  z.object({
    productName: z.string(),
    brand: z.string().nullish(),
    categories: z.array(z.string()).optional(),
    Application: z.array(z.string()).optional(),
    items: z.array(z.object({ itemId: z.string() })),
  }),
);
export async function readPurchasedProduct(
  session: PortalSession,
  input: unknown,
) {
  const data = z
    .object({
      orderId: compareOfferInput.shape.orderId,
      index: compareOfferInput.shape.index,
    })
    .strict()
    .parse(input);
  const order = await getBuyerInsightOrder(session, data.orderId);
  const item = order.items[data.index];
  if (!item)
    throw new PortalError(
      400,
      "INSIGHT_ITEM",
      "Choose an item from this order.",
    );
  const params = new URLSearchParams({ fq: `skuId:${item.id}` });
  const products = await checkoutRequest(
    session,
    `/api/catalog_system/pub/products/search?${params}`,
    productSchema,
  );
  const product = products.find((p) =>
    p.items.some((i) => i.itemId === item.id),
  );
  if (!product)
    throw new PortalError(
      404,
      "INSIGHT_PRODUCT",
      "This purchased SKU is no longer available in the catalogue.",
    );
  return {
    name: product.productName,
    brand: product.brand || null,
    categories: product.categories || [],
    applications: product.Application || [],
  };
}
