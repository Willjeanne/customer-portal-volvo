import assert from "node:assert/strict";
import test from "node:test";
import {
  appendMessage,
  applyHistory,
  isDelta,
  makeContactId,
  normaliseTimestamp,
  parseFrame,
  readCatalogTitle,
  readHistory,
  readMoney,
  readEnvelope,
  readProducts,
  readSeller,
  readText,
  readVehicles,
  registerCallback,
  unescapeText,
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

/**
 * The flow sometimes ships its own delivery envelope as message text. Rendered
 * raw it filled the thread with JSON, and the same answer then arrived again.
 */
const ENVELOPE = JSON.stringify({
  is_final_output: true,
  messages_sent: [
    {
      text: "Here are common filter options for commercial fleets.",
      catalog_message: {
        send_catalog: false,
        products: [
          {
            product: "Oil Filter",
            product_retailer_info: [
              {
                name: "Oil Filter for Volvo Trucks VM - 20526087",
                retailer_id: "1680",
                price: "142.39",
                sale_price: "128.15",
                seller_id: "1",
              },
            ],
          },
        ],
      },
    },
  ],
});

test("a delivery envelope is unwrapped into the message it announces", () => {
  const parts = readEnvelope(ENVELOPE);
  assert.ok(parts);
  assert.equal(parts.length, 1);
  assert.equal(
    parts[0].text,
    "Here are common filter options for commercial fleets.",
  );
  assert.deepEqual(
    parts[0].products.map((product) => product.id),
    ["1680"],
  );
});

test("an ordinary answer is never mistaken for an envelope", () => {
  assert.equal(readEnvelope("Here are common filter options."), null);
  assert.equal(readEnvelope('{"text": "not an envelope"}'), null);
  assert.equal(readEnvelope("{ broken"), null);
  // Recognised, but carrying nothing to show: dropped rather than rendered.
  assert.deepEqual(readEnvelope('{"is_final_output": true}'), []);
});

test("the same answer is not appended twice", () => {
  const first = {
    key: "a",
    role: "agent" as const,
    text: "Here are common filter options.",
    products: [],
    vehicles: [] as string[],
    at: 1,
  };
  const echo = { ...first, key: "b", at: 2 };
  const thread = appendMessage([], first);
  assert.equal(thread.length, 1);
  assert.equal(appendMessage(thread, echo).length, 1);

  // Different products with the same words are still a different answer.
  const withProduct = {
    ...first,
    key: "c",
    products: readEnvelope(ENVELOPE)![0].products,
  };
  assert.equal(appendMessage(thread, withProduct).length, 2);

  // And the visitor may legitimately repeat themselves later in the thread.
  const visitor = { ...first, key: "d", role: "visitor" as const };
  assert.equal(appendMessage(thread, visitor).length, 2);
});

/**
 * Captured from the live channel: a catalogue answer arrives twice in one turn,
 * first as the envelope in `stream_end.content`, then as an `interactive`
 * message whose text is escaped a second time (literal \" and \n).
 */
const TWIN_TEXT =
  'Suggested from Truck 147\'s maintenance alert "Brake wear detected" (2026-09-17), system Brakes.\nPrice shown is the public trade-policy price, not your contract price.';
const TWIN_ITEM = {
  name: "Brake Shoes Set for Volvo Trucks FH13 Classic, FH13 New - 3095196",
  price: "1516.39",
  sale_price: "1516.39",
  seller_id: "1",
};
const STREAM_END_CONTENT = JSON.stringify({
  is_final_output: true,
  messages_sent: [
    {
      text: TWIN_TEXT,
      catalog_message: {
        send_catalog: false,
        products: [
          {
            product: "Truck 147 alert part",
            product_retailer_info: [{ ...TWIN_ITEM, retailer_id: "1437#1" }],
          },
        ],
      },
    },
  ],
});
const INTERACTIVE_BODY = {
  type: "interactive",
  text: TWIN_TEXT.replace(/"/g, '\\"').replace(/\n/g, "\\n"),
  interactive: {
    type: "product_list",
    action: {
      sections: [
        {
          title: "Truck 147 alert part",
          product_items: [{ ...TWIN_ITEM, product_retailer_id: "1437#1" }],
        },
      ],
    },
  },
};

test("double-escaped text is decoded, JSON is left intact", () => {
  assert.equal(unescapeText('say \\"hi\\"\\nbye'), 'say "hi"\nbye');
  assert.equal(unescapeText("plain text"), "plain text");
  // An envelope keeps its escapes, or it would no longer parse.
  assert.equal(unescapeText(STREAM_END_CONTENT), STREAM_END_CONTENT);
  assert.ok(readEnvelope(unescapeText(STREAM_END_CONTENT)));
});

test("the envelope and its escaped interactive twin render once", () => {
  const [part] = readEnvelope(STREAM_END_CONTENT)!;
  const fromEnvelope = {
    key: "envelope",
    role: "agent" as const,
    text: part.text,
    products: part.products,
    vehicles: part.vehicles,
    at: 1,
  };
  const fromInteractive = {
    key: "interactive",
    role: "agent" as const,
    text: readText(INTERACTIVE_BODY),
    products: readProducts(INTERACTIVE_BODY),
    vehicles: readVehicles(INTERACTIVE_BODY),
    at: 2,
  };
  assert.equal(fromInteractive.text, TWIN_TEXT);
  const thread = appendMessage(appendMessage([], fromEnvelope), fromInteractive);
  assert.equal(thread.length, 1);
});

/** Shape sent by the fleet agents: vehicles through the catalogue SDK. */
function vehicleEntry(id: string, name: string) {
  return {
    retailer_id: id,
    name,
    description: "Volvo FM13 Classic · Maintenance Due",
    product_url: `/fleet/${id.replace(/^vehicle:/, "")}`,
    price: "0.00",
    seller_id: "1",
    currency: "USD",
  };
}
const VEHICLES_GROUP = {
  product: "Vehicles",
  product_retailer_info: [
    vehicleEntry("vehicle:truck-189", "Truck 189"),
    vehicleEntry("vehicle:truck-203", "Truck 203"),
    vehicleEntry("vehicle:truck-276", "Truck 276"),
  ],
};

test("vehicle entries become vehicle ids, never products", () => {
  const body = {
    text: "The vehicles due for maintenance are: ...",
    catalog_message: {
      send_catalog: false,
      action_button_text: "View",
      products: [VEHICLES_GROUP],
    },
  };
  assert.deepEqual(readVehicles(body), ["truck-189", "truck-203", "truck-276"]);
  assert.deepEqual(readProducts(body), []);
});

test("a message may carry vehicles and parts together", () => {
  const body = {
    text: "Parts for Truck 147",
    catalog_message: {
      products: [
        {
          product: "Vehicles",
          product_retailer_info: [vehicleEntry("vehicle:truck-147", "Truck 147")],
        },
        {
          product: "Brakes",
          product_retailer_info: [
            { retailer_id: "1437#1", name: "Brake Shoes Set", price: "1516.39" },
          ],
        },
      ],
    },
  };
  assert.deepEqual(readVehicles(body), ["truck-147"]);
  assert.deepEqual(
    readProducts(body).map((product) => product.id),
    ["1437#1"],
  );
});

test("only the vehicle: prefix marks a vehicle", () => {
  const body = {
    catalog_message: {
      products: [
        {
          product_retailer_info: [
            { retailer_id: "vehicles:truck-1", name: "Look-alike" },
            { retailer_id: "truck-189", name: "Bare id" },
            { retailer_id: "vehicle:", name: "Empty id" },
            { product_retailer_id: "vehicle:truck-147", name: "Truck 147" },
          ],
        },
      ],
    },
  };
  assert.deepEqual(readVehicles(body), ["truck-147"]);
  // Unknown prefixes stay parts; an empty vehicle id is neither.
  assert.deepEqual(
    readProducts(body).map((product) => product.id),
    ["vehicles:truck-1", "truck-189"],
  );
});

test("duplicate vehicle ids are kept once, in order", () => {
  const body = {
    catalog_message: {
      products: [
        {
          product_retailer_info: [
            vehicleEntry("vehicle:truck-203", "Truck 203"),
            vehicleEntry("vehicle:truck-189", "Truck 189"),
            vehicleEntry("vehicle:truck-203", "Truck 203 again"),
          ],
        },
      ],
    },
  };
  assert.deepEqual(readVehicles(body), ["truck-203", "truck-189"]);
});

test("history and envelopes carry vehicles, even without text", () => {
  const [message] = readHistory([
    {
      direction: "in",
      timestamp: 1_700_000_000,
      message: { catalog_message: { products: [VEHICLES_GROUP] } },
    },
  ]);
  assert.equal(message.role, "agent");
  assert.equal(message.text, "");
  assert.deepEqual(message.products, []);
  assert.deepEqual(message.vehicles, ["truck-189", "truck-203", "truck-276"]);

  const parts = readEnvelope(
    JSON.stringify({
      is_final_output: true,
      messages_sent: [{ catalog_message: { products: [VEHICLES_GROUP] } }],
    }),
  );
  assert.deepEqual(parts?.[0].vehicles, ["truck-189", "truck-203", "truck-276"]);
});

test("different vehicles with the same words are a different answer", () => {
  const first = {
    key: "a",
    role: "agent" as const,
    text: "Here is the vehicle.",
    products: [],
    vehicles: ["truck-147"],
    at: 1,
  };
  const thread = appendMessage([], first);
  assert.equal(appendMessage(thread, { ...first, key: "b" }).length, 1);
  assert.equal(
    appendMessage(thread, { ...first, key: "c", vehicles: ["truck-203"] }).length,
    2,
  );
});
