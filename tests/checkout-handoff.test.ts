import test from "node:test";
import assert from "node:assert/strict";
import { checkoutHandoff } from "../src/server/cart";
import { makePreviewContext } from "../src/domain/fixtures";
import type { PortalSession } from "../src/server/session-store";
test("handoff rechecks access and uses only the nonempty session cart and fixed checkout destination", async (t) => {
  const session: PortalSession = {
    context: { ...makePreviewContext("buyer"), mode: "vtex" },
    expiresAt: Date.now() + 10000,
    upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
    orderFormId: "cart1",
  };
  let allowed = true,
    empty = false;
  let reads = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(init.method === undefined || init.method === "GET", true);
    if (url.includes("/resources/PlaceOrders/")) return Response.json(allowed);
    reads++;
    assert.ok(url.endsWith("/orderForm/cart1"));
    return Response.json({
      orderFormId: "cart1",
      items: empty ? [] : [{ id: "1", seller: "1", quantity: 2 }],
    });
  });
  assert.deepEqual(await checkoutHandoff(session), {
    url: "https://www.emeafaststore.com/checkout?orderFormId=cart1",
  });
  allowed = false;
  const before = reads;
  await assert.rejects(checkoutHandoff(session), { code: "PURCHASE_DENIED" });
  assert.equal(reads, before);
  allowed = true;
  empty = true;
  await assert.rejects(checkoutHandoff(session), { code: "CART_EMPTY" });
  session.orderFormId = undefined;
  await assert.rejects(checkoutHandoff(session), { code: "CART_EMPTY" });
});
