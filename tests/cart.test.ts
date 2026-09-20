import test from "node:test";
import assert from "node:assert/strict";
import { cartDifference } from "../src/domain/cart";
import { prepareCart, transferCart, cartOperation } from "../src/server/cart";
import { makePreviewContext } from "../src/domain/fixtures";
import type { PortalSession } from "../src/server/session-store";
const session = (): PortalSession => ({
  context: {
    ...makePreviewContext("buyer"),
    mode: "vtex",
    permissionsVerified: true,
  },
  expiresAt: Date.now() + 100000,
  upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
});
test("cart result measures increases per seller including refusals and shrinkage", () => {
  const requested = [
    { id: "1", seller: "1", quantity: 3 },
    { id: "1", seller: "2", quantity: 2 },
  ];
  const result = cartDifference(
    requested,
    [
      { id: "1", seller: "1", quantity: 5 },
      { id: "1", seller: "2", quantity: 4 },
    ],
    [
      { id: "1", seller: "1", quantity: 6 },
      { id: "1", seller: "2", quantity: 3 },
    ],
  );
  assert.equal(result.complete, false);
  assert.deepEqual(
    result.lines.map((l) => l.added),
    [1, -1],
  );
});
test("preparation resolves exact references, merges aliases, retains cookies and consumes transfer once", async (t) => {
  const s = session();
  let writes = 0;
  let cookieSent = false;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(init.cache, "no-store");
    if (url.includes("/api/sessions"))
      return Response.json(
        {
          namespaces: {
            authentication: { storeUserId: { value: s.context.user.id } },
            store: {
              channel: { value: "1" },
              countryCode: { value: "USA" },
              currencyCode: { value: "USD" },
            },
          },
        },
        { headers: { "Set-Cookie": "vtex_session=context; Domain=www.emeafaststore.com; Path=/" } },
      );
    cookieSent ||= String(new Headers(init.headers).get("Cookie")).includes(
      "vtex_session=context",
    );
    if (url.includes("products/search"))
      return Response.json([
        {
          items: [
            {
              itemId: "10",
              name: "Filter",
              referenceId: [{ Value: "REF" }],
              sellers: [{ sellerId: "2", sellerDefault: true }],
            },
          ],
        },
      ]);
    if (url.includes("simulation")) {
      assert.deepEqual(JSON.parse(String(init.body)).items, [
        { id: "10", seller: "2", quantity: 3 },
      ]);
      return Response.json({
        items: [
          {
            id: "10",
            seller: "2",
            quantity: 3,
            availability: "available",
            sellingPrice: 1250,
            price: 1500,
          },
        ],
      });
    }
    if (url.endsWith("/items")) {
      writes++;
      return Response.json({
        orderFormId: "cart1",
        items: [{ id: "10", seller: "2", quantity: 5 }],
      });
    }
    return Response.json({
      orderFormId: "cart1",
      items: [{ id: "10", seller: "2", quantity: 2 }],
    });
  });
  const result = await prepareCart(s, {
    lines: [
      { sku: "10", quantity: 1 },
      { sku: "REF", quantity: 2 },
    ],
  });
  assert.equal(result.lines.length, 1);
  assert.equal(result.lines[0].price, 1250);
  assert.equal(cookieSent, true);
  const transferred = await transferCart(s, result.id);
  assert.equal(transferred.complete, true);
  assert.equal(writes, 1);
  await assert.rejects(transferCart(s, result.id), {
    code: "PREPARATION_EXPIRED",
  });
  assert.equal(writes, 1);
});
test("unverified purchasing rights and overlapping calls cannot write to a cart", async () => {
  const s = session();
  s.context.permissionsVerified = false;
  await assert.rejects(transferCart(s, "anything"), {
    code: "PURCHASE_UNVERIFIED",
  });
  await cartOperation(s, async () => {
    await assert.rejects(
      cartOperation(s, async () => true),
      { code: "CART_BUSY" },
    );
  });
  assert.equal(s.cartBusy, false);
});

test("expired or foreign-unit preparations are rejected before contacting VTEX", async () => {
  const s=session();
  s.preparation={id:"check",expiresAt:Date.now()-1,currency:"USD",lines:[],canTransfer:true,transferBlock:null,channel:"1",unitId:s.context.unit.id};
  await assert.rejects(transferCart(s,"check"),{code:"PREPARATION_EXPIRED"});
  s.preparation.expiresAt=Date.now()+10000; s.preparation.unitId="other";
  await assert.rejects(transferCart(s,"check"),{code:"PREPARATION_EXPIRED"});
});
