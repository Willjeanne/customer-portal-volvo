import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { makePreviewContext } from "../src/domain/fixtures";
import { checkoutFormSchema, promissoryOptions } from "../src/domain/checkout";
import { checkoutView } from "../src/server/checkout";
import { updatePayment, placeOrder } from "../src/server/checkout-payment";
import { orderStatus } from "../src/server/order-attempts";
import type { PortalSession } from "../src/server/session-store";
function fixture() {
  const id = randomUUID();
  const session: PortalSession = {
    context: { ...makePreviewContext("buyer"), mode: "vtex" },
    expiresAt: Date.now() + 60000,
    orderFormId: id,
    upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
  };
  const form = checkoutFormSchema.parse({
    orderFormId: id,
    value: 1500,
    storePreferencesData: { currencyCode: "USD" },
    items: [
      {
        id: "1",
        uniqueId: "1",
        name: "Brake",
        seller: "1",
        quantity: 1,
        sellingPrice: 1200,
        availability: "available",
      },
    ],
    totalizers: [
      { id: "Items", name: "Items", value: 1200 },
      { id: "Shipping", name: "Shipping", value: 300 },
    ],
    shippingData: {
      selectedAddresses: [
        {
          addressId: "a",
          addressType: "residential",
          country: "USA",
          street: "Main",
        },
      ],
      logisticsInfo: [
        {
          itemIndex: 0,
          addressId: "a",
          selectedSla: "normal",
          selectedDeliveryChannel: "delivery",
          slas: [
            {
              id: "normal",
              name: "Standard",
              deliveryChannel: "delivery",
              price: 300,
            },
          ],
        },
      ],
    },
    paymentData: {
      paymentSystems: [
        { id: 17, name: "Promissory", groupName: "promissoryPaymentGroup" },
        { id: 2, name: "Visa", groupName: "creditCardPaymentGroup" },
      ],
      installmentOptions: [
        {
          paymentSystem: "17",
          installments: [
            {
              count: 1,
              value: 1500,
              total: 1500,
              interestRate: 0,
              hasInterestRate: false,
            },
          ],
        },
      ],
      payments: [
        {
          paymentSystem: "17",
          installments: 1,
          value: 1500,
          referenceValue: 1500,
        },
      ],
    },
  });
  return { session, form };
}
test("Promissory selection rejects invented methods, amounts, stale snapshots and permission failures", async (t) => {
  const { session, form } = fixture();
  let allowed = true;
  let writes = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.includes("PlaceOrders")) return Response.json(allowed);
    if (init.method === "POST") {
      writes++;
      assert.deepEqual(JSON.parse(String(init.body)), {
        payments: [
          {
            paymentSystem: "17",
            installments: 1,
            value: 1500,
            referenceValue: 1500,
          },
        ],
      });
    }
    return Response.json(form);
  });
  assert.equal(promissoryOptions(form).length, 1);
  const revision = checkoutView(checkoutFormSchema.parse(form)).revision;
  await assert.rejects(updatePayment(session, { revision, paymentSystem: 2 }), {
    code: "PAYMENT_UNAVAILABLE",
  });
  await assert.rejects(
    updatePayment(session, { revision, paymentSystem: 17, value: 1 }),
  );
  await assert.rejects(
    updatePayment(session, { revision: "a".repeat(64), paymentSystem: 17 }),
    { code: "CHECKOUT_CHANGED" },
  );
  assert.equal(writes, 0);
  await updatePayment(session, { revision, paymentSystem: 17 });
  assert.equal(writes, 1);
  allowed = false;
  await assert.rejects(placeOrder(session, { revision, confirm: true }), {
    code: "PURCHASE_DENIED",
  });
});
test("Place → Promissory payment → callback returns confirmation without a second purchase", async (t) => {
  const { session, form } = fixture();
  const calls: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.includes("PlaceOrders")) return Response.json(true);
    if (url.endsWith("/transaction")) {
      calls.push("place");
      assert.equal((await orderStatus(session))?.status, "processing");
      assert.equal(JSON.parse(String(init.body)).value, 1500);
      return Response.json({
        orderFormId: form.orderFormId,
        orderGroup: "group1",
        merchantTransactions: [
          {
            transactionId: "tx1",
            merchantName: "volvoemea",
            payments: [
              { paymentSystem: "17", value: 1500, referenceValue: 1500 },
            ],
          },
        ],
      });
    }
    if (url.includes("vtexpayments")) {
      calls.push("pay");
      const payload = JSON.parse(String(init.body));
      assert.deepEqual(payload[0].fields, {});
      assert.equal(payload[0].paymentSystem, 17);
      return new Response(null, { status: 201 });
    }
    if (url.includes("gatewayCallback")) {
      calls.push("process");
      return new Response(null, { status: 204 });
    }
    return Response.json(form);
  });
  const input = {
    revision: checkoutView(checkoutFormSchema.parse(form)).revision,
    confirm: true,
  };
  const result = await placeOrder(session, input);
  assert.equal(result.status, "submitted");
  assert.equal(result.orderGroup, "group1");
  assert.deepEqual(calls, ["place", "pay", "process"]);
  assert.equal(session.orderFormId, undefined);
  assert.equal((await orderStatus(session))?.status, "submitted");
  // Simulate a stale copy of the session surviving a lost commit.
  session.orderFormId = form.orderFormId;
  await assert.rejects(placeOrder(session, input), {
    code: "ORDER_ALREADY_ATTEMPTED",
  });
  assert.equal(calls.length, 3);
});
test("Uncertain transaction cannot be automatically retried, including after reload", async (t) => {
  const { session, form } = fixture();
  let purchases = 0;
  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.includes("PlaceOrders")) return Response.json(true);
    if (url.endsWith("/transaction")) {
      purchases++;
      throw new Error("timeout after write");
    }
    return Response.json(form);
  });
  const input = {
    revision: checkoutView(checkoutFormSchema.parse(form)).revision,
    confirm: true,
  };
  assert.equal((await placeOrder(session, input)).status, "uncertain");
  await assert.rejects(placeOrder({ ...session }, input), {
    code: "ORDER_ALREADY_ATTEMPTED",
  });
  assert.equal(purchases, 1);
});
test("Missing delivery, unavailable items, stale payment and absent confirmation never place an order", async (t) => {
  const { session, form } = fixture();
  let writes = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.includes("PlaceOrders")) return Response.json(true);
    if (init.method === "POST") writes++;
    return Response.json(form);
  });
  await assert.rejects(
    placeOrder(session, {
      revision: checkoutView(checkoutFormSchema.parse(form)).revision,
      confirm: false,
    }),
  );
  form.shippingData!.logisticsInfo[0].selectedSla = null;
  await assert.rejects(
    placeOrder(session, {
      revision: checkoutView(checkoutFormSchema.parse(form)).revision,
      confirm: true,
    }),
    { code: "DELIVERY_INCOMPLETE" },
  );
  form.shippingData!.logisticsInfo[0].selectedSla = "normal";
  form.items[0].availability = "withoutStock";
  await assert.rejects(
    placeOrder(session, {
      revision: checkoutView(checkoutFormSchema.parse(form)).revision,
      confirm: true,
    }),
    { code: "CART_NOT_READY" },
  );
  form.items[0].availability = "available";
  form.paymentData!.updateStatus = "outdated";
  await assert.rejects(
    placeOrder(session, {
      revision: checkoutView(checkoutFormSchema.parse(form)).revision,
      confirm: true,
    }),
    { code: "PAYMENT_REQUIRED" },
  );
  assert.equal(writes, 0);
});

test("Payment failure preserves the order reference and never calls the gateway callback", async (t) => {
  const { session, form } = fixture();
  let callbacks = 0;
  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.includes("PlaceOrders")) return Response.json(true);
    if (url.endsWith("/transaction"))
      return Response.json({
        orderFormId: form.orderFormId,
        orderGroup: "pending1",
        merchantTransactions: [
          {
            transactionId: "tx1",
            merchantName: "volvoemea",
            payments: [
              { paymentSystem: "17", value: 1500, referenceValue: 1500 },
            ],
          },
        ],
      });
    if (url.includes("vtexpayments"))
      return new Response(null, { status: 500 });
    if (url.includes("gatewayCallback")) callbacks++;
    return Response.json(form);
  });
  const result = await placeOrder(session, {
    revision: checkoutView(form).revision,
    confirm: true,
  });
  assert.equal(result.status, "uncertain");
  assert.equal(result.orderGroup, "pending1");
  assert.equal(callbacks, 0);
});

test("Production claim survives a lost session commit and Redis failure stops placement", async (t) => {
  const previous = { ...process.env };
  Object.assign(process.env, {
    NODE_ENV: "production",
    UPSTASH_REDIS_REST_URL: "https://redis.example",
    UPSTASH_REDIS_REST_TOKEN: "test",
  });
  t.after(() => {
    for (const k of [
      "NODE_ENV",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
    ]) {
      if (previous[k] === undefined) delete process.env[k];
      else process.env[k] = previous[k];
    }
  });
  const { session, form } = fixture();
  const db = new Map<string, string>();
  let purchases = 0;
  let redisDown = false;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url === "https://redis.example") {
      if (redisDown) throw new Error("offline");
      const c = JSON.parse(String(init.body));
      if (c[0] === "GET")
        return Response.json({ result: db.get(c[1]) || null });
      if (c.includes("NX") && db.has(c[1]))
        return Response.json({ result: null });
      db.set(c[1], c[2]);
      return Response.json({ result: "OK" });
    }
    if (url.includes("PlaceOrders")) return Response.json(true);
    if (url.endsWith("/transaction")) {
      purchases++;
      throw new Error("response lost");
    }
    return Response.json(form);
  });
  const input = { revision: checkoutView(form).revision, confirm: true };
  await placeOrder(session, input);
  await assert.rejects(placeOrder({ ...session }, input), {
    code: "ORDER_ALREADY_ATTEMPTED",
  });
  assert.equal(purchases, 1);
  redisDown = true;
  await assert.rejects(placeOrder({ ...session }, input), {
    code: "SESSION_STORAGE",
  });
  assert.equal(purchases, 1);
});

test("Transaction refusal retains only the diagnostic code and does not send payment", async (t) => {
  const { session, form } = fixture();
  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.includes("PlaceOrders")) return Response.json(true);
    if (url.endsWith("/transaction"))
      return Response.json(
        {
          error: {
            code: "TEST_BUDGET_REFUSAL",
            message: "private customer data",
          },
        },
        { status: 403 },
      );
    assert.ok(!url.includes("vtexpayments"));
    return Response.json(form);
  });
  const result = await placeOrder(session, {
    revision: checkoutView(form).revision,
    confirm: true,
  });
  assert.deepEqual(result.failure, {
    stage: "transaction",
    code: "CART_UNAVAILABLE",
    httpStatus: 403,
    upstreamCode: "TEST_BUDGET_REFUSAL",
  });
  assert.equal(JSON.stringify(result).includes("private customer data"), false);
});
