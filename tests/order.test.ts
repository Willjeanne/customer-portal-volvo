import assert from "node:assert/strict";
import test from "node:test";
import { getBuyerOrder } from "../src/server/account";
import { documentLink, orderMoney } from "../src/domain/order";
import { makePreviewContext } from "../src/domain/fixtures";

test("order detail keeps shopper authorization, rejects mismatches and preserves not-found", async (t) => {
  const context = makePreviewContext("buyer"); context.mode = "vtex";
  const session = { context, expiresAt: Date.now() + 10000, upstreamCookies: "VtexIdclientAutCookie_volvoemea=test" };
  let status = 200; let id = "123-01";
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, "https://volvoemea.vtexcommercestable.com.br/api/oms/user/orders/123-01");
    assert.equal(init.cache, "no-store");
    assert.ok(new Headers(init.headers).get("Cookie"));
    return Response.json({ orderId: id, creationDate: "2026-09-19T08:00:00Z", status: "invoiced", value: 12345, items: [], packageAttachment: null }, { status });
  });
  assert.equal((await getBuyerOrder(session, "123-01")).value, 12345);
  id = "other"; await assert.rejects(getBuyerOrder(session, "123-01"), { code: "ORDER_MISMATCH" });
  status = 403; await assert.rejects(getBuyerOrder(session, "123-01"), { status: 403 });
  status = 404; await assert.rejects(getBuyerOrder(session, "123-01"), { status: 404 });
  await assert.rejects(getBuyerOrder(session, "../admin"));
});
test("document links exclude executable URLs and amounts retain cents", () => {
  for (const value of ["javascript:alert(1)", "data:text/html,test", "//example.com", "https://user:pass@example.com", "http://example.com"]) assert.equal(documentLink(value), null);
  assert.equal(documentLink("https://example.com/invoice.pdf"), "https://example.com/invoice.pdf");
  assert.equal(orderMoney(12345, "USD"), "$123.45");
});
