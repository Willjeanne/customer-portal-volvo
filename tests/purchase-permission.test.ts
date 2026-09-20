import test from "node:test";
import assert from "node:assert/strict";
import { mayPlaceOrders } from "../src/server/purchase-permission";
import { makePreviewContext } from "../src/domain/fixtures";
import type { PortalSession } from "../src/server/session-store";
test("PlaceOrders uses the signed-in user and requires an explicit boolean, never a role name", async (t) => {
  const session: PortalSession = {
    context: {
      ...makePreviewContext("buyer"),
      mode: "vtex",
      permissions: [],
      permissionsVerified: false,
    },
    expiresAt: Date.now() + 10000,
    upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
  };
  let payload: unknown = true;
  let status = 200;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(
      url,
      `https://volvoemea.vtexcommercestable.com.br/api/license-manager/storefront/bff/users/${encodeURIComponent(session.context.user.id)}/resources/PlaceOrders/granted?an=volvoemea`,
    );
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "manual");
    assert.equal(
      new Headers(init.headers).get("VtexIdclientAutCookie_volvoemea"),
      "test",
    );
    return Response.json(payload, { status });
  });
  assert.equal(await mayPlaceOrders(session), true);
  payload = false;
  assert.equal(await mayPlaceOrders(session), false);
  payload = { role: "Buyer", granted: true };
  await assert.rejects(mayPlaceOrders(session), {
    code: "PURCHASE_CHECK_FORMAT",
  });
  status = 403;
  await assert.rejects(mayPlaceOrders(session), {
    code: "PURCHASE_CHECK_UNAVAILABLE",
  });
  status = 500;
  await assert.rejects(mayPlaceOrders(session), {
    code: "PURCHASE_CHECK_UNAVAILABLE",
  });
  session.context.mode = "preview";
  await assert.rejects(mayPlaceOrders(session), { code: "LIVE_REQUIRED" });
});
