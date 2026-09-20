import assert from "node:assert/strict";
import test from "node:test";
import { validateVtexSession } from "../src/server/vtex";

test("buyer session uses authorized own-unit context and accepts a root without ancestor names", async (t) => {
  const userId = "0e7a4f04-6d0b-411b-afb7-2d1e1e5fe1a0";
  const token = `test.${Buffer.from(JSON.stringify({ userId, customerId: userId, account: "volvoemea", exp: Date.now() / 1000 + 600 })).toString("base64url")}.test`;
  const cookie = `VtexIdclientAutCookie_volvoemea=${token}`;
  let status = 200;
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(url), `https://volvoemea.myvtex.com/_v/store-front/users/${userId}/units`);
    assert.equal(new Headers(init?.headers).get("VtexIdclientAutCookie_volvoemea"), token);
    assert.equal(init?.cache, "no-store");
    return Response.json({ orgUnit: { id: userId, name: "Test root", path: { names: null } } }, { status });
  });
  assert.equal((await validateVtexSession(cookie)).orgUnit.name, "Test root");
  status = 403;
  await assert.rejects(validateVtexSession(cookie), { code: "VTEX_CONTEXT_FAILED", status: 401 });
});
