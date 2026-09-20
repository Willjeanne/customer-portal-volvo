import assert from "node:assert/strict";
import test from "node:test";
import { getBuyerProfile, listBuyerOrders } from "../src/server/account";
import { makePreviewContext } from "../src/domain/fixtures";
import type { PortalSession } from "../src/server/session-store";

test("account reads stay shopper-scoped, uncached and reject a foreign identity", async (t) => {
  const context = makePreviewContext("buyer");
  context.mode = "vtex";
  const session: PortalSession = { context, expiresAt: Date.now() + 10000, upstreamCookies: "VtexIdclientAutCookie_volvoemea=test" };
  let foreign = false;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "manual");
    assert.equal(new Headers(init.headers).get("X-VTEX-API-AppKey"), null);
    if (url.includes("/api/sessions?")) {
      assert.equal(init.method, "POST");
      return Response.json({ namespaces: { authentication: { storeUserId: { value: foreign ? "other" : context.user.id } }, shopper: { firstName: { value: "Test" } } } });
    }
    assert.equal(url, "https://volvoemea.vtexcommercestable.com.br/api/oms/user/orders?page=2&per_page=10");
    return Response.json({ list: [], paging: { total: 0, pages: 0, currentPage: 2, perPage: 10 } });
  });
  assert.equal((await getBuyerProfile(session)).name, "Test");
  foreign = true;
  await assert.rejects(getBuyerProfile(session), { code: "PROFILE_SCOPE" });
  assert.equal((await listBuyerOrders(session, 2)).list.length, 0);
  assert.throws(() => listBuyerOrders(session, -1));
  session.context.mode = "preview";
  await assert.rejects(listBuyerOrders(session), { code: "LIVE_SESSION_REQUIRED" });
});
