import assert from "node:assert/strict";
import test from "node:test";
import { buyerHeaders } from "../src/server/buyer-headers";

test("Buyer Portal receives the account token as a dedicated header and cookie", () => {
  const cookie = "VtexIdclientAutCookie=generic; VtexIdclientAutCookie_volvoemea=account-token==";
  const headers = buyerHeaders(cookie);
  assert.equal(headers.VtexIdclientAutCookie_volvoemea, "account-token==");
  assert.equal(headers.Cookie, cookie);
  assert.equal(headers.Authorization, undefined);
});

test("Buyer Portal never substitutes a generic or foreign account token", () => {
  for (const cookie of ["", "VtexIdclientAutCookie=generic", "VtexIdclientAutCookie_other=foreign", "VtexIdclientAutCookie_volvoemea="]) {
    assert.throws(() => buyerHeaders(cookie), { code: "VTEX_COOKIE_MISSING" });
  }
});
