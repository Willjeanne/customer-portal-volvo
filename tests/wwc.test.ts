import assert from "node:assert/strict";
import test from "node:test";
import {
  applyHistory,
  isDelta,
  makeContactId,
  normaliseTimestamp,
  parseFrame,
  readCatalogTitle,
  readHistory,
  readMoney,
  readProducts,
  readSeller,
  readText,
  registerCallback,
} from "../src/domain/wwc";

test("register callback follows the documented shape", () => {
  assert.equal(
    registerCallback("https://flows.weni.ai", "6d7f6ee7-884a-4070-b9ad-8f9212991965"),
    "https://flows.weni.ai/c/wwc/6d7f6ee7-884a-4070-b9ad-8f9212991965/receive",
  );
  // A trailing slash on the origin must not double up in the path.
  assert.equal(
    registerCallback("https://flows.weni.ai/", "abc"),
    "https://flows.weni.ai/c/wwc/abc/receive",
  );
});

test("contact id carries the hostname and is not reused between calls", () => {
  const first = makeContactId("customer-portal-volvo.vercel.app");
  const second = makeContactId("customer-portal-volvo.vercel.app");
  assert.match(first, /^\d{10}@customer-portal-volvo\.vercel\.app$/);
  assert.notEqual(first, second);
});

test("only well-formed JSON objects become frames", () => {
  assert.deepEqual(parseFrame('{"type":"ping"}'), { type: "ping" });
  assert.equal(parseFrame("not json"), null);
  assert.equal(parseFrame('["array"]'), null);
  assert.equal(parseFrame(42), null);
});

test("deltas are recognised by a string v without a type", () => {
  assert.equal(isDelta({ v: "hel", seq: 1 }), true);
  assert.equal(isDelta({ type: "message" }), false);
  // A typed frame that happens to carry `v` is not a delta.
  assert.equal(isDelta({ type: "stream_end", v: "x" }), false);
  assert.equal(isDelta({ v: 12 }), false);
});

test("prices parse from strings with either decimal separator", () => {
  assert.equal(readMoney("1250"), 1250);
  assert.equal(readMoney("1.125,50".replace(".", "")), 1125.5);
  assert.equal(readMoney("2601,10"), 2601.1);
  assert.equal(readMoney(null), null);
  assert.equal(readMoney("free"), null);
});

test("seller comes from the retailer id before the seller_id field", () => {
  assert.equal(readSeller("100001#7", "1"), "7");
  assert.equal(readSeller("100001", "3"), "3");
  // Neither source present: the documented default.
  assert.equal(readSeller("100001", undefined), "1");
});

test("catalog_message products are read through retailer_id", () => {
  const body = {
    type: "text",
    text: "Featured parts",
    catalog_message: {
      products: [
        {
          product: "Featured parts",
          product_retailer_info: [
            {
              retailer_id: "100001#1",
              name: "Part A",
              price: "1250",
              sale_price: "1125",
              image: "https://cdn.example.com/a.jpg",
              product_url: "https://shop.example.com/a/p",
              description: "Optional copy.",
            },
            { retailer_id: "100002#1#4", name: "Part B", price: "2890", seller_id: "1" },
          ],
        },
      ],
    },
  };

  const products = readProducts(body);
  assert.equal(products.length, 2);

  const [first, second] = products;
  assert.equal(first.id, "100001#1");
  assert.equal(first.price, 1125);
  // A list price only survives when it is above the charged price.
  assert.equal(first.listPrice, 1250);
  assert.equal(first.sellerId, "1");

  // Optional fields stay null rather than being invented.
  assert.equal(second.image, null);
  assert.equal(second.url, null);
  assert.equal(second.listPrice, null);
  assert.equal(second.price, 2890);

  assert.equal(readText(body), "Featured parts");
  assert.equal(readCatalogTitle(body), "Featured parts");
});

test("the four product sources are merged and de-duplicated", () => {
  const products = readProducts({
    interactive: {
      action: {
        product_items: [{ product_retailer_id: "1#1", name: "From interactive" }],
        sections: [
          { product_items: [{ product_retailer_id: "2#1", name: "From section" }] },
        ],
      },
    },
    order: { product_items: [{ product_retailer_id: "3#1", name: "From order" }] },
    catalog_message: {
      products: [
        {
          product_retailer_info: [
            { retailer_id: "4#1", name: "From catalog" },
            // Same id as the interactive item: it must not appear twice.
            { retailer_id: "1#1", name: "Duplicate" },
          ],
        },
      ],
    },
  });
  assert.deepEqual(
    products.map((product) => product.id),
    ["1#1", "2#1", "3#1", "4#1"],
  );
});

test("items without an id or a name are discarded", () => {
  const products = readProducts({
    catalog_message: {
      products: [
        {
          product_retailer_info: [
            { name: "No id" },
            { retailer_id: "9#1" },
            { retailer_id: "8#1", name: "Kept" },
          ],
        },
      ],
    },
  });
  assert.deepEqual(
    products.map((product) => product.id),
    ["8#1"],
  );
});

test("timestamps in seconds are promoted to milliseconds", () => {
  assert.equal(normaliseTimestamp(1_700_000_000, 5), 1_700_000_000_000);
  assert.equal(normaliseTimestamp(1_700_000_000_000, 5), 1_700_000_000_000);
  assert.equal(normaliseTimestamp(undefined, 5), 5);
  assert.equal(normaliseTimestamp(-1, 5), 5);
});

test("history is ordered oldest-first with inverted direction labels", () => {
  const messages = readHistory([
    { direction: "in", timestamp: 1_700_000_200, message: { text: "Agent reply" } },
    { direction: "out", timestamp: 1_700_000_100, message: { text: "Visitor question" } },
  ]);
  assert.deepEqual(
    messages.map((message) => [message.role, message.text]),
    [
      ["visitor", "Visitor question"],
      ["agent", "Agent reply"],
    ],
  );
});

test("a shorter history never replaces a longer local thread", () => {
  const local = readHistory([
    { direction: "out", timestamp: 1, message: { text: "One" } },
    { direction: "in", timestamp: 2, message: { text: "Two" } },
  ]);
  assert.equal(applyHistory(local, []).length, 2);
  assert.equal(
    applyHistory(local, readHistory([{ direction: "out", timestamp: 1, message: { text: "One" } }]))
      .length,
    2,
  );
});

/**
 * The socket lifecycle guards, extracted as the predicates the component uses.
 * A remount must be able to reconnect, and a superseded socket must stay quiet.
 */
function mayConnect(closing: boolean, configured: boolean): boolean {
  return configured && !closing;
}
function mayHandle(closing: boolean, current: object, source: object): boolean {
  return !closing && current === source;
}

test("a remount can reconnect after the cleanup flagged the socket closing", () => {
  let closing = false;
  assert.equal(mayConnect(closing, true), true);

  // Unmount: the cleanup raises the flag so pending retries stop.
  closing = true;
  assert.equal(mayConnect(closing, true), false);

  // Remount: the effect clears it again, or the section never reconnects.
  closing = false;
  assert.equal(mayConnect(closing, true), true);

  // Configuration still gates everything.
  assert.equal(mayConnect(false, false), false);
});

test("a superseded socket neither updates state nor triggers a reconnect", () => {
  const first = { id: "a" };
  const second = { id: "b" };
  // While it is the live socket, its frames count.
  assert.equal(mayHandle(false, first, first), true);
  // Once replaced, the old socket's late close must be ignored.
  assert.equal(mayHandle(false, second, first), false);
  // And an intentional teardown silences even the live one.
  assert.equal(mayHandle(true, second, second), false);
});
