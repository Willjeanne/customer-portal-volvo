import { z } from "zod";
import { orderDetailSchema } from "./order";

const benefitSchema = z.object({ id: z.string(), name: z.string().nullish() });
export const insightOrderSchema = orderDetailSchema.extend({
  totals: z
    .array(z.object({ id: z.string(), value: z.number().int() }))
    .nullish(),
  ratesAndBenefitsData: z
    .object({ rateAndBenefitsIdentifiers: z.array(benefitSchema).nullish() })
    .nullish(),
  items: z.array(
    orderDetailSchema.shape.items.element.extend({
      seller: z.string().nullish(),
      price: z.number().int().nonnegative().nullish(),
      listPrice: z.number().int().nonnegative().nullish(),
      priceDefinition: z
        .object({ total: z.number().int().nonnegative() })
        .nullish(),
      priceTags: z
        .array(
          z.object({
            identifier: z.string().nullish(),
            value: z.number(),
            isPercentual: z.boolean().optional(),
          }),
        )
        .nullish(),
      additionalInfo: z
        .object({
          categories: z
            .array(
              z.object({
                id: z.union([z.string(), z.number()]),
                name: z.string(),
              }),
            )
            .nullish(),
        })
        .nullish(),
    }),
  ),
});
export type InsightOrder = z.infer<typeof insightOrderSchema>;
export const insightPeriodSchema = z.enum(["30", "90", "365", "all"]);
export type InsightPeriod = z.infer<typeof insightPeriodSchema>;
export function periodStart(period: InsightPeriod, now: number): number {
  return period === "all" ? 0 : now - Number(period) * 86400000;
}
export function includedOrder(
  order: { status: string; creationDate: string },
  since: number,
  now: number,
): boolean {
  return (
    ![
      "canceled",
      "cancelled",
      "request-cancel",
      "cancellation-requested",
      "cancelation-requested",
    ].includes(order.status) &&
    Number.isFinite(Date.parse(order.creationDate)) &&
    Date.parse(order.creationDate) >= since &&
    Date.parse(order.creationDate) <= now
  );
}
export interface PurchasedPart {
  key: string;
  sku: string;
  reference: string | null;
  name: string;
  seller: string | null;
  currency: string | null;
  quantity: number;
  amount: number;
  orderIds: string[];
  category: string;
  lastOrderId: string;
  lastIndex: number;
  lastDate: string;
  lastQuantity: number;
  lastUnitPrice: number;
  averageIntervalDays: number | null;
}
export function summarizePurchases(orders: InsightOrder[]) {
  const parts = new Map<string, PurchasedPart>();
  const dates = new Map<string, Set<number>>();
  const currencies = new Map<
    string,
    {
      currency: string | null;
      itemAmount: number;
      discounts: number;
      discountOrders: number;
      orders: number;
    }
  >();
  const discounts = orders.map((order) => {
    const discount = order.totals?.find((t) => t.id === "Discounts");
    // The order totalizer is the only monetary discount source. Price tags and
    // list-price deltas are never added to it or attributed as promotion savings.
    const amount = discount
      ? Math.max(0, -discount.value)
      : order.totals?.some((t) => t.id === "Items")
        ? 0
        : null;
    const usedIds = new Set(
      order.items.flatMap((i) =>
        (i.priceTags || []).filter((t) => t.value < 0).map((t) => t.identifier),
      ),
    );
    const benefits = (
      order.ratesAndBenefitsData?.rateAndBenefitsIdentifiers || []
    )
      .filter((b) => usedIds.has(b.id))
      .map((b) => b.name || b.id);
    return {
      orderId: order.orderId,
      date: order.creationDate,
      currency: order.storePreferencesData?.currencyCode || null,
      amount,
      benefits: [...new Set(benefits)],
    };
  });
  for (const order of orders) {
    const currency = order.storePreferencesData?.currencyCode || null;
    const bucket = currencies.get(currency || "unknown") || {
      currency,
      itemAmount: 0,
      discounts: 0,
      discountOrders: 0,
      orders: 0,
    };
    bucket.orders++;
    const discount = discounts.find((d) => d.orderId === order.orderId)!;
    if (discount.amount !== null) {
      bucket.discounts += discount.amount;
      bucket.discountOrders++;
    }
    order.items.forEach((item, index) => {
      const amount =
        item.priceDefinition?.total ??
        Math.round(item.sellingPrice * item.quantity);
      bucket.itemAmount += amount;
      const key = JSON.stringify([
        item.id,
        item.seller || null,
        currency,
        currency ? null : order.orderId,
      ]);
      const part = parts.get(key) || {
        key,
        sku: item.id,
        reference: item.refId || null,
        name: item.name,
        seller: item.seller || null,
        currency,
        quantity: 0,
        amount: 0,
        orderIds: [],
        category:
          item.additionalInfo?.categories?.at(-1)?.name || "Unclassified",
        lastOrderId: order.orderId,
        lastIndex: index,
        lastDate: order.creationDate,
        lastQuantity: item.quantity,
        lastUnitPrice: amount / item.quantity,
        averageIntervalDays: null,
      };
      part.quantity += item.quantity;
      part.amount += amount;
      if (!part.orderIds.includes(order.orderId))
        part.orderIds.push(order.orderId);
      if (Date.parse(order.creationDate) > Date.parse(part.lastDate)) {
        part.lastOrderId = order.orderId;
        part.lastIndex = index;
        part.lastDate = order.creationDate;
        part.lastQuantity = item.quantity;
        part.lastUnitPrice = amount / item.quantity;
      }
      const occurrences = dates.get(key) || new Set<number>();
      occurrences.add(Date.parse(order.creationDate));
      dates.set(key, occurrences);
      parts.set(key, part);
    });
    currencies.set(currency || "unknown", bucket);
  }
  for (const part of parts.values()) {
    const times = [...dates.get(part.key)!].sort((a, b) => a - b);
    if (times.length >= 3)
      part.averageIntervalDays = Math.max(
        1,
        Math.round((times.at(-1)! - times[0]) / (times.length - 1) / 86400000),
      );
  }
  const pairs = new Map<string, { names: string[]; orderIds: string[] }>();
  for (const order of orders) {
    const unique = [
      ...new Map(order.items.map((item) => [item.id, item])).values(),
    ].slice(0, 30);
    for (let i = 0; i < unique.length; i++)
      for (let j = i + 1; j < unique.length; j++) {
        const key = [unique[i].id, unique[j].id].sort().join(":");
        const pair = pairs.get(key) || {
          names: [unique[i].name, unique[j].name],
          orderIds: [],
        };
        pair.orderIds.push(order.orderId);
        pairs.set(key, pair);
      }
  }
  return {
    pairs: [...pairs.values()]
      .filter((p) => p.orderIds.length >= 2)
      .sort((a, b) => b.orderIds.length - a.orderIds.length)
      .slice(0, 3),
    currencies: [...currencies.values()],
    parts: [...parts.values()].sort(
      (a, b) => b.orderIds.length - a.orderIds.length || b.amount - a.amount,
    ),
    discounts,
  };
}
export const compareOfferInput = z
  .object({
    orderId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,79}$/),
    index: z.number().int().min(0).max(1000),
    quantity: z.number().int().min(1).max(9999),
    compareQuantity: z.number().int().min(1).max(9999).optional(),
  })
  .strict();
export interface SimulatedOffer {
  quantity: number;
  accepted: number;
  available: boolean;
  total: number | null;
  unitPrice: number | null;
  benefits: string[];
}
export interface OfferComparison {
  sku: string;
  seller: string;
  currency: string;
  checkedAt: string;
  historicalUnitPrice: number | null;
  offers: SimulatedOffer[];
}

export type PurchasingReport = ReturnType<typeof summarizePurchases> & {
  period: InsightPeriod;
  updatedAt: string;
  scope: { user: string; unit: string };
  coverage: {
    scanned: number;
    totalAccessible: number;
    analyzed: number;
    failed: number;
    truncated: boolean;
  };
};
