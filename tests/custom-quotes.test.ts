import test from "node:test";
import assert from "node:assert/strict";
import { listStoreQuotes } from "../src/server/custom-quotes";
import { makePreviewContext } from "../src/domain/fixtures";
import type { PortalSession } from "../src/server/session-store";

test("custom quotes scope by server identity, convert cents and reject foreign data or denied API", async (t) => {
  const session: PortalSession = {
    context: { ...makePreviewContext("buyer"), mode: "vtex" },
    expiresAt: Date.now() + 10000,
    upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
  };
  let foreign = false,
    denied = false,
    wrongUser = false;
  let quoteCalls = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(init.cache, "no-store");
    assert.equal(new Headers(init.headers).get("X-VTEX-API-AppKey"), null);
    if (url.includes("/api/sessions?"))
      return Response.json({
        namespaces: {
          authentication: {
            storeUserId: {
              value: wrongUser ? "other" : session.context.user.id,
            },
          },
          profile: { email: { value: "contract@example.com" } },
          store: { currencyCode: { value: "USD" } },
        },
      });
    quoteCalls++;
    const target = new URL(url);
    assert.equal(target.pathname, "/api/dataentities/quotes/search");
    assert.equal(
      target.searchParams.get("_where"),
      'organizationId="contract@example.com"',
    );
    assert.equal(new Headers(init.headers).get("REST-Range"), "resources=0-99");
    if (denied) return Response.json({ error: "denied" }, { status: 403 });
    return Response.json([
      {
        id: "quote1",
        name: "Filters",
        organizationId: foreign ? "other@example.com" : "contract@example.com",
        creationDate: "2026-09-01T00:00:00Z",
        expirationDate: "2099-01-01T00:00:00Z",
        items: [{ id: 1, name: "Filter", price: 1250, quantity: 2 }],
      },
    ]);
  });
  const result = await listStoreQuotes(session, {
    page: 1,
    label: "filter",
    status: "pending",
  });
  assert.equal(result.items[0].amount, 25);
  assert.equal(result.totalItems, 1);
  assert.equal(result.currency, "USD");
  foreign = true;
  await assert.rejects(listStoreQuotes(session, { page: 1, label: "" }), {
    code: "QUOTE_SCOPE",
  });
  foreign = false;
  denied = true;
  await assert.rejects(listStoreQuotes(session, { page: 1, label: "" }), {
    code: "CUSTOM_QUOTES_UNAVAILABLE",
  });
  const before = quoteCalls;
  wrongUser = true;
  await assert.rejects(listStoreQuotes(session, { page: 1, label: "" }), {
    code: "QUOTE_SCOPE",
  });
  assert.equal(quoteCalls, before);
});
