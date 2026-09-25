import test from "node:test";
import assert from "node:assert/strict";
import {
  getBuyerLists,
  getBuyerListItems,
  createBuyerList,
} from "../src/server/lists";
import { makePreviewContext } from "../src/domain/fixtures";
test("lists use fixed read queries and never treat GraphQL errors as empty lists", async (t) => {
  const context = makePreviewContext("buyer");
  context.mode = "vtex";
  const session = {
    context,
    expiresAt: Date.now() + 10000,
    upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
  };
  let fail = false;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, "https://www.emeafaststore.com/_v/private/graphql/v1");
    assert.equal(init.cache, "no-store");
    const body = JSON.parse(String(init.body));
    assert.ok(body.query.startsWith("query "));
    return Response.json(
      fail
        ? { data: { getLists: [] }, errors: [{ message: "denied" }] }
        : { data: { getLists: [] } },
    );
  });
  assert.deepEqual(await getBuyerLists(session), []);
  fail = true;
  await assert.rejects(getBuyerLists(session), { code: "LISTS_RESPONSE" });
  await assert.rejects(getBuyerListItems(session, "invalid/../id"));
  context.mode = "preview";
  await assert.rejects(getBuyerLists(session), { code: "LIVE_REQUIRED" });
});

test("list contract failure differs from denied access and invalid responses", async (t) => {
  const session = {
    context: { ...makePreviewContext("buyer"), mode: "vtex" as const },
    expiresAt: Date.now() + 10000,
    upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
  };
  let status = 400;
  let invalidJson = false;
  t.mock.method(globalThis, "fetch", async () =>
    invalidJson
      ? new Response("not json", { status: 200 })
      : Response.json(
          { errors: [{ message: "GraphQL validation failed" }] },
          { status },
        ),
  );
  await assert.rejects(getBuyerLists(session), {
    code: "LISTS_CONTRACT_UNAVAILABLE",
  });
  status = 403;
  await assert.rejects(getBuyerLists(session), {
    code: "LISTS_UNAVAILABLE",
    status: 403,
  });
  invalidJson = true;
  await assert.rejects(getBuyerLists(session), { code: "LISTS_RESPONSE" });
});

test("list creation uses the native mutation with validated fields and shopper identity", async (t) => {
  const session = {
    context: { ...makePreviewContext("buyer"), mode: "vtex" as const },
    expiresAt: Date.now() + 10000,
    upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
  };
  let calls = 0;
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: string, init: RequestInit) => {
      calls++;
      const body = JSON.parse(String(init.body));
      assert.ok(body.query.startsWith("mutation PortalCreateList"));
      assert.deepEqual(body.variables.input, {
        name: "Workshop",
        description: "Oil",
        cadenceType: "monthly",
        sourceType: "manual",
      });
      assert.equal(init.cache, "no-store");
      return Response.json({
        data: {
          createList: {
            id: "new-list",
            name: "Workshop",
            description: "Oil",
            itemCount: 0,
            status: "active",
          },
        },
      });
    },
  );
  await assert.rejects(
    createBuyerList(session, { name: "", cadenceType: "none" }),
  );
  await assert.rejects(
    createBuyerList(session, {
      name: "Workshop",
      cadenceType: "none",
      contractId: "foreign",
    }),
  );
  assert.equal(calls, 0);
  assert.equal(
    (
      await createBuyerList(session, {
        name: " Workshop ",
        description: "Oil",
        cadenceType: "monthly",
      })
    ).id,
    "new-list",
  );
  assert.equal(calls, 1);
});
