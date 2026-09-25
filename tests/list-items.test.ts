import test from "node:test";
import assert from "node:assert/strict";
import { populateBuyerList } from "../src/server/list-items";
import { makePreviewContext } from "../src/domain/fixtures";
const session = () => ({
  context: { ...makePreviewContext("buyer"), mode: "vtex" as const },
  expiresAt: Date.now() + 10000,
  upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
});
test("list population resolves references and increases existing quantities, then verifies readback", async (t) => {
  let quantity = 3;
  let mutations = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.includes("products/search"))
      return Response.json([
        {
          productId: "p1",
          items: [{ itemId: "42", referenceId: [{ Value: "oil-ref" }] }],
        },
      ]);
    const body = JSON.parse(String(init.body));
    if (body.query.includes("PortalLists"))
      return Response.json({
        data: { getLists: [{ id: "list1", name: "Oil", status: "active" }] },
      });
    if (body.query.includes("PortalListItems"))
      return Response.json({
        data: {
          getListItems: [
            { id: "item1", skuId: "42", preferredQuantity: quantity },
          ],
        },
      });
    mutations++;
    assert.equal(body.variables.itemId, "item1");
    quantity = body.variables.input.preferredQuantity;
    return Response.json({
      data: {
        updateListItem: {
          id: "item1",
          skuId: "42",
          preferredQuantity: quantity,
        },
      },
    });
  });
  const result = await populateBuyerList(session(), {
    listId: "list1",
    lines: [{ sku: "oil-ref", quantity: 2 }],
  });
  assert.equal(quantity, 5);
  assert.equal(mutations, 1);
  assert.equal(result.complete, true);
});
test("foreign list and ambiguous references are refused before any list writes", async (t) => {
  let mutations = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.includes("products/search")) return Response.json([]);
    const body = JSON.parse(String(init.body));
    if (body.query.startsWith("mutation")) mutations++;
    return Response.json({
      data: { getLists: [{ id: "list1", name: "Oil", status: "active" }] },
    });
  });
  await assert.rejects(
    populateBuyerList(session(), {
      listId: "foreign",
      lines: [{ sku: "oil", quantity: 2 }],
    }),
    { code: "LIST_DENIED" },
  );
  await assert.rejects(
    populateBuyerList(session(), {
      listId: "list1",
      lines: [{ sku: "oil", quantity: 2 }],
    }),
    { code: "LIST_REFERENCE" },
  );
  assert.equal(mutations, 0);
});
test("past order is read under buyer identity and a failed write is reported as partial", async (t) => {
  let orderReads = 0,
    writes = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.includes("/api/oms/user/orders/")) {
      orderReads++;
      return Response.json({
        orderId: "order1",
        creationDate: "2026-09-25T10:00:00Z",
        status: "handling",
        value: 20,
        items: [{ id: "42", name: "Oil", quantity: 2, sellingPrice: 10 }],
      });
    }
    if (url.includes("products/search"))
      return Response.json([{ productId: "p1", items: [{ itemId: "42" }] }]);
    const body = JSON.parse(String(init.body));
    if (body.query.includes("PortalLists"))
      return Response.json({
        data: { getLists: [{ id: "list1", name: "Oil", status: "active" }] },
      });
    if (body.query.includes("PortalListItems"))
      return Response.json({ data: { getListItems: [] } });
    writes++;
    assert.deepEqual(body.variables.input, {
      skuId: "42",
      productId: "p1",
      preferredQuantity: 2,
    });
    return new Response(null, { status: 503 });
  });
  const result = await populateBuyerList(session(), {
    listId: "list1",
    orderId: "order1",
  });
  assert.equal(orderReads, 1);
  assert.equal(writes, 1);
  assert.equal(result.complete, false);
  assert.equal(result.completed, 0);
});
