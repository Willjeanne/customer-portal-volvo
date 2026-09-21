import test from "node:test";
import assert from "node:assert/strict";
import { readCheckout, updateShipping } from "../src/server/checkout";
import { makePreviewContext } from "../src/domain/fixtures";
import type { PortalSession } from "../src/server/session-store";
import type { CheckoutForm } from "../src/domain/checkout";
const address = {
  addressId: "home",
  addressType: "residential",
  street: "Main",
  number: "1",
  city: "Dallas",
  postalCode: "75001",
  country: "USA",
};
const initial = (): CheckoutForm => ({
  orderFormId: "cart1",
  value: 1200,
  storePreferencesData: { currencyCode: "USD" },
  items: [
    {
      id: "1",
      uniqueId: "line1",
      name: "Filter",
      seller: "1",
      quantity: 1,
      sellingPrice: 1200,
    },
  ],
  totalizers: [{ id: "Items", name: "Items", value: 1200 }],
  messages: [],
  shippingData: {
    availableAddresses: [address],
    selectedAddresses: [address],
    logisticsInfo: [
      {
        itemIndex: 0,
        addressId: "home",
        selectedSla: null,
        slas: [
          {
            id: "standard",
            name: "Standard",
            deliveryChannel: "delivery",
            price: 300,
            shippingEstimate: "3bd",
          },
        ],
      },
    ],
  },
});
const session = (): PortalSession => ({
  context: { ...makePreviewContext("buyer"), mode: "vtex" },
  expiresAt: Date.now() + 10000,
  upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
  orderFormId: "cart1",
});
test("checkout reads session cart and accepts only current server addresses/options, not client prices", async (t) => {
  const s = session();
  let form = initial();
  let writes = 0;
  let allowed = true;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(init.cache, "no-store");
    if (url.includes("PlaceOrders")) return Response.json(allowed);
    assert.ok(url.includes("/orderForm/cart1"));
    if (init.method === "POST") {
      writes++;
      const body = JSON.parse(String(init.body));
      assert.equal(body.selectedAddresses[0].street, "Main");
      assert.equal(body.price, undefined);
      form = {
        ...form,
        shippingData: {
          ...form.shippingData!,
          selectedAddresses: body.selectedAddresses,
          logisticsInfo: form.shippingData!.logisticsInfo.map((line) => ({
            ...line,
            selectedSla: body.logisticsInfo[0].selectedSla,
          })),
        },
      };
    }
    return Response.json(form);
  });
  const view = await readCheckout(s);
  assert.equal("orderFormId" in view, false);
  assert.equal(view.items[0].name, "Filter");
  await assert.rejects(
    updateShipping(s, {
      action: "address",
      revision: view.revision,
      addressId: "foreign",
    }),
    { code: "ADDRESS_DENIED" },
  );
  await assert.rejects(
    updateShipping(s, {
      action: "delivery",
      revision: view.revision,
      options: [{ itemIndex: 0, slaId: "fake" }],
    }),
    { code: "DELIVERY_UNAVAILABLE" },
  );
  await assert.rejects(
    updateShipping(s, {
      action: "delivery",
      revision: view.revision,
      options: [{ itemIndex: 0, slaId: "standard" }],
      price: 0,
    }),
  );
  assert.equal(writes, 0);
  const saved = await updateShipping(s, {
    action: "delivery",
    revision: view.revision,
    options: [{ itemIndex: 0, slaId: "standard" }],
  });
  assert.equal(saved.shippingData?.logisticsInfo[0].selectedSla, "standard");
  assert.equal(writes, 1);
  await assert.rejects(
    updateShipping(s, {
      action: "address",
      revision: view.revision,
      addressId: "home",
    }),
    { code: "CHECKOUT_CHANGED" },
  );
  allowed = false;
  await assert.rejects(
    updateShipping(s, {
      action: "address",
      revision: saved.revision,
      addressId: "home",
    }),
    { code: "PURCHASE_DENIED" },
  );
  assert.equal(writes, 1);
});
test("empty session cannot create a new checkout and masked addresses are never written", async (t) => {
  const s = session();
  s.orderFormId = undefined;
  await assert.rejects(readCheckout(s), { code: "CART_EMPTY" });
  s.orderFormId = "cart1";
  const form = initial();
  form.shippingData!.availableAddresses[0] = { ...address, street: "***" };
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.notEqual(init.method, "POST");
    return Response.json(url.includes("PlaceOrders") ? true : form);
  });
  const view = await readCheckout(s);
  await assert.rejects(
    updateShipping(s, {
      action: "address",
      revision: view.revision,
      addressId: "home",
    }),
    { code: "ADDRESS_MASKED" },
  );
});
