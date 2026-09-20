import test from "node:test";
import assert from "node:assert/strict";
import { draftCsv, parseOrderCsv } from "../src/domain/order-draft";
import { canVisit } from "../src/domain/portal";
import { makePreviewContext } from "../src/domain/fixtures";
test("CSV import handles separators, quoted fields, duplicates and round trips", () => {
  assert.deepEqual(parseOrderCsv('\uFEFFsku;quantity\r\n"123";2\r\n123;3').lines, [{sku:"123",quantity:5}]);
  const lines = [{sku:"REF-12",quantity:4}];
  assert.deepEqual(parseOrderCsv(draftCsv(lines)).lines, lines);
  assert.deepEqual(parseOrderCsv("123\t2\n456\t3").lines, [{sku:"123",quantity:2},{sku:"456",quantity:3}]);
});
test("invalid imports cannot partially replace a draft", () => {
  for (const text of ["123,2\n456,-1", "123,1.5", "=HYPERLINK(x),2", "123,9999\n123,1", "sku,wrong\n123,2", "123,2,extra", "", Array(201).fill("123,1").join("\n")]) {
    const result = parseOrderCsv(text); assert.ok(result.errors.length); assert.equal(result.lines.length,0);
  }
});
test("draft preparation is distinct from permission to purchase", () => {
  const context = makePreviewContext("procurement");
  assert.equal(canVisit(context,"quick-order"),true);
  assert.equal(canVisit(context,"parts"),false);
  assert.equal(context.permissions.includes("purchase"),false);
});
