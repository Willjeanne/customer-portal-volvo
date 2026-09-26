import test from "node:test";
import assert from "node:assert/strict";
import {
  includedOrder,
  periodStart,
  summarizePurchases,
  type InsightOrder,
} from "../src/domain/insights";
import {
  comparePurchasedOffers,
  readPurchasingInsights,
  readPurchasedProduct,
} from "../src/server/insights";
import { makePreviewContext } from "../src/domain/fixtures";
import type { PortalSession } from "../src/server/session-store";
const order = (id = "order-1", currency = "USD"): InsightOrder => ({
  orderId: id,
  creationDate: "2026-09-01T12:00:00Z",
  status: "invoiced",
  value: 901,
  storePreferencesData: { currencyCode: currency },
  totals: [
    { id: "Items", value: 1200 },
    { id: "Discounts", value: -299 },
  ],
  ratesAndBenefitsData: {
    rateAndBenefitsIdentifiers: [
      { id: "promo", name: "Workshop offer" },
      { id: "unused", name: "Not used" },
    ],
  },
  items: [
    {
      id: "1437",
      name: "Brake shoes",
      refId: "3095196",
      seller: "seller-A",
      quantity: 3,
      price: 400,
      listPrice: 800,
      sellingPrice: 300,
      priceDefinition: { total: 901 },
      priceTags: [{ identifier: "promo", value: -100, isPercentual: false }],
      additionalInfo: { categories: [{ id: "2", name: "Brakes" }] },
    },
  ],
});
const session = (): PortalSession => ({
  context: { ...makePreviewContext("buyer"), mode: "vtex" },
  expiresAt: Date.now() + 60000,
  upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
  draft: [{ sku: "kept", quantity: 1 }],
  orderFormId: "existing-cart",
});
test("insights use recorded discounts once, precise totals and separate currencies", () => {
  const usd = order(),
    eur = order("order-2", "EUR");
  const data = summarizePurchases([usd, eur]);
  assert.equal(data.currencies.length, 2);
  assert.equal(data.currencies[0].discounts, 299); // no list price delta or price tag added
  assert.equal(data.currencies[0].itemAmount, 901); // not rounded unit 300 * 3
  assert.deepEqual(data.discounts[0].benefits, ["Workshop offer"]);
  assert.equal(data.parts.length, 2);
  const missing = { ...order(), totals: undefined };
  assert.equal(summarizePurchases([missing]).discounts[0].amount, null);
  assert.equal(
    summarizePurchases([{ ...missing, totals: [] }]).discounts[0].amount,
    null,
  );
  assert.equal(
    summarizePurchases([{ ...missing, totals: [{ id: "Items", value: 901 }] }])
      .discounts[0].amount,
    0,
  );
});
test("patterns require three dates and exclude cancellations/future orders at selection", () => {
  const a = order(),
    b = { ...order("order-2"), creationDate: "2026-09-11T12:00:00Z" },
    c = { ...order("order-3"), creationDate: "2026-09-21T12:00:00Z" };
  assert.equal(summarizePurchases([a, b]).parts[0].averageIntervalDays, null);
  const part = summarizePurchases([c, a, b]).parts[0];
  assert.equal(part.averageIntervalDays, 10);
  assert.equal(part.lastOrderId, c.orderId);
  assert.equal(part.quantity, 9);
  const now = Date.parse("2026-09-25T12:00:00Z"),
    since = periodStart("30", now);
  assert.equal(includedOrder(a, since, now), true);
  for (const status of ["canceled", "request-cancel", "cancellation-requested"])
    assert.equal(includedOrder({ ...a, status }, since, now), false);
  assert.equal(
    includedOrder({ ...a, creationDate: "2027-01-01T00:00:00Z" }, since, now),
    false,
  );
});
test("offer comparison rereads purchased SKU/seller, checks identity and never modifies cart or draft", async (t) => {
  const s = session();
  const quantities: number[] = [];
  let wrongIdentity = false;
  let rejectOrder = false;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(init.cache, "no-store");
    if (url.includes("/api/oms/user/orders/"))
      return rejectOrder
        ? new Response("", { status: 403 })
        : Response.json(order());
    if (url.includes("/api/sessions"))
      return Response.json({
        namespaces: {
          authentication: {
            storeUserId: { value: wrongIdentity ? "other" : s.context.user.id },
          },
          store: {
            channel: { value: "3" },
            countryCode: { value: "USA" },
            currencyCode: { value: "USD" },
          },
        },
      });
    assert.ok(url.endsWith("/api/checkout/pub/orderForms/simulation?sc=3"));
    const body = JSON.parse(String(init.body));
    assert.equal(body.items[0].id, "1437");
    assert.equal(body.items[0].seller, "seller-A");
    quantities.push(body.items[0].quantity);
    const quantity = body.items[0].quantity;
    return Response.json({
      items: [
        {
          id: "1437",
          seller: "seller-A",
          quantity,
          availability: "available",
          sellingPrice: quantity === 3 ? 300 : 250,
          priceDefinition: { total: quantity === 3 ? 901 : 1500 },
        },
      ],
    });
  });
  const result = await comparePurchasedOffers(s, {
    orderId: "order-1",
    index: 0,
    quantity: 3,
    compareQuantity: 6,
  });
  assert.deepEqual(quantities, [3, 6]);
  assert.equal(result.offers[0].total, 901);
  assert.equal(result.offers[1].unitPrice, 250);
  assert.equal(s.orderFormId, "existing-cart");
  assert.deepEqual(s.draft, [{ sku: "kept", quantity: 1 }]);
  assert.equal(s.preparation, undefined);
  wrongIdentity = true;
  await assert.rejects(
    comparePurchasedOffers(s, { orderId: "order-1", index: 0, quantity: 1 }),
    { code: "INSIGHT_IDENTITY" },
  );
  rejectOrder = true;
  await assert.rejects(
    comparePurchasedOffers(s, { orderId: "order-1", index: 0, quantity: 1 }),
    { code: "ACCOUNT_READ_FAILED" },
  );
  await assert.rejects(
    comparePurchasedOffers(s, { orderId: "order-1", index: 0, quantity: 0 }),
  );
});
test("partial stock is never a complete offer and currency changes suppress historic comparison", async (t) => {
  const s = session();
  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.includes("/api/oms/")) return Response.json(order());
    if (url.includes("/api/sessions"))
      return Response.json({
        namespaces: {
          authentication: { storeUserId: { value: s.context.user.id } },
          store: {
            channel: { value: "1" },
            countryCode: { value: "USA" },
            currencyCode: { value: "EUR" },
          },
        },
      });
    return Response.json({
      items: [
        {
          id: "1437",
          seller: "seller-A",
          quantity: 1,
          availability: "available",
          sellingPrice: 250,
        },
      ],
    });
  });
  const result = await comparePurchasedOffers(s, {
    orderId: "order-1",
    index: 0,
    quantity: 3,
  });
  assert.equal(result.historicalUnitPrice, null);
  assert.equal(result.offers[0].available, false);
  assert.equal(result.offers[0].total, null);
});
test("history is bounded, deduplicated and partial failures reported instead of invented totals", async (t) => {
  const s = session();
  let listCalls = 0;
  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.includes("?page=")) {
      listCalls++;
      return Response.json({
        list: [
          {
            orderId: "order-1",
            creationDate: order().creationDate,
            status: "invoiced",
            totalValue: 901,
          },
          {
            orderId: "order-2",
            creationDate: order().creationDate,
            status: "invoiced",
            totalValue: 901,
          },
        ],
        paging: { total: 100, pages: 10, currentPage: listCalls, perPage: 10 },
      });
    }
    if (url.endsWith("order-2")) return new Response("", { status: 403 });
    return Response.json(order());
  });
  const data = await readPurchasingInsights(s, "all");
  assert.equal(listCalls, 3);
  assert.equal(data.coverage.scanned, 2);
  assert.equal(data.coverage.failed, 1);
  assert.equal(data.coverage.analyzed, 1);
  assert.equal(data.coverage.truncated, true);
});
test("product knowledge only accepts exact purchased SKU catalogue matches", async (t) => {
  let matching = false;
  t.mock.method(globalThis, "fetch", async (url: string) =>
    url.includes("/api/oms/")
      ? Response.json(order())
      : Response.json([
          {
            productName: "Brake shoes",
            brand: "Volvo",
            categories: ["/Trucks/Brakes/"],
            Application: ["FH13 Classic"],
            items: [{ itemId: matching ? "1437" : "other" }],
          },
        ]),
  );
  await assert.rejects(
    readPurchasedProduct(session(), { orderId: "order-1", index: 0 }),
    { code: "INSIGHT_PRODUCT" },
  );
  matching = true;
  assert.deepEqual(
    (await readPurchasedProduct(session(), { orderId: "order-1", index: 0 }))
      .applications,
    ["FH13 Classic"],
  );
});
