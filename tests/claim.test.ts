import test from "node:test";
import assert from "node:assert/strict";
import { validateClaimDraft } from "../src/domain/claim";
const draft = {
  type: "claim",
  reason: "Damaged part",
  subject: "Damaged box",
  description: "The part arrived damaged.",
  resolution: "Replacement",
  lines: [{ index: 0, quantity: 1 }],
};
test("claim review validates ordered quantities, selected lines and type-specific reasons", () => {
  assert.ok(validateClaimDraft(draft, [{ quantity: 2 }]).data);
  for (const lines of [
    [],
    [{ index: 0, quantity: 3 }],
    [{ index: 1, quantity: 1 }],
    [
      { index: 0, quantity: 1 },
      { index: 0, quantity: 1 },
    ],
    [{ index: 0, quantity: 0 }],
  ])
    assert.ok(validateClaimDraft({ ...draft, lines }, [{ quantity: 2 }]).error);
  assert.ok(
    validateClaimDraft({ ...draft, type: "return" }, [{ quantity: 2 }]).error,
  );
  assert.ok(
    validateClaimDraft({ ...draft, description: " " }, [{ quantity: 2 }]).error,
  );
});
