import test from "node:test";
import assert from "node:assert/strict";
import { addDraftLine, replaceDraft } from "../src/server/draft";
import { makePreviewContext } from "../src/domain/fixtures";
import type { PortalSession } from "../src/server/session-store";
const session = (): PortalSession => ({
  context: makePreviewContext("buyer"),
  expiresAt: Date.now() + 10000,
});
test("parallel additions merge without losing lines, and stale full saves cannot overwrite them", async () => {
  const s = session();
  const results = await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      Promise.resolve().then(() =>
        addDraftLine(s, { line: { sku: String(i % 3), quantity: 1 } }),
      ),
    ),
  );
  assert.equal(results.length, 30);
  assert.equal(s.draftRevision, 30);
  assert.deepEqual(s.draft, [
    { sku: "0", quantity: 10 },
    { sku: "1", quantity: 10 },
    { sku: "2", quantity: 10 },
  ]);
  const before = structuredClone(s.draft);
  assert.throws(() => replaceDraft(s, { lines: [], revision: 0 }), {
    code: "DRAFT_CONFLICT",
  });
  assert.deepEqual(s.draft, before);
  assert.deepEqual(
    replaceDraft(s, {
      lines: [
        { sku: "x", quantity: 2 },
        { sku: "x", quantity: 3 },
      ],
      revision: 30,
    }),
    { saved: true, revision: 31 },
  );
  assert.deepEqual(s.draft, [{ sku: "x", quantity: 5 }]);
});
test("quantity, line limits and busy cart reject atomically without a false success", () => {
  const s = session();
  s.draft = [{ sku: "x", quantity: 9998 }];
  assert.deepEqual(addDraftLine(s, { line: { sku: "x", quantity: 1 } }), {
    added: 1,
    sku: "x",
    total: 9999,
    revision: 1,
  });
  assert.throws(() => addDraftLine(s, { line: { sku: "x", quantity: 1 } }), {
    code: "DRAFT_QUANTITY_LIMIT",
  });
  assert.equal(s.draft[0].quantity, 9999);
  assert.equal(s.draftRevision, 1);
  s.draft = Array.from({ length: 200 }, (_, i) => ({
    sku: String(i),
    quantity: 1,
  }));
  assert.throws(
    () => addDraftLine(s, { line: { sku: "extra", quantity: 1 } }),
    { code: "DRAFT_LINE_LIMIT" },
  );
  assert.equal(s.draft.length, 200);
  assert.equal(s.draftRevision, 1);
  s.cartBusy = true;
  assert.throws(() => addDraftLine(s, { line: { sku: "0", quantity: 1 } }), {
    code: "DRAFT_BUSY",
  });
  assert.equal(s.draft[0].quantity, 1);
  const other = session();
  assert.equal(other.draft, undefined);
});
