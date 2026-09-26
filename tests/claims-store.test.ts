import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { saveClaim, listClaims } from "../src/server/claims";
import { makePreviewContext } from "../src/domain/fixtures";

test("demo claims: buyer isolation, fresh quantities, revisions and retry-safe submission", async (t) => {
  const context = { ...makePreviewContext("buyer"), mode: "vtex" as const };
  context.user = { ...context.user, id: randomUUID() };
  const session = {
    context,
    expiresAt: Date.now() + 10000,
    upstreamCookies: "VtexIdclientAutCookie_volvoemea=test",
  };
  let quantity = 2;
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({
      orderId: "123-01",
      creationDate: "2026-09-25T10:00:00Z",
      status: "invoiced",
      value: 100,
      items: [{ id: "42", name: "Brake", quantity, sellingPrice: 50 }],
    }),
  );
  const input = {
    id: randomUUID(),
    revision: 0,
    action: "draft",
    orderId: "123-01",
    draft: {
      type: "claim",
      reason: "Damaged part",
      subject: "Damaged brake",
      description: "The brake arrived damaged.",
      resolution: "Replacement",
      lines: [{ index: 0, quantity: 2 }],
    },
  };
  const first = await saveClaim(session, input);
  assert.equal(first.claim.revision, 1);
  assert.deepEqual((await saveClaim(session, input)).claim, first.claim);
  assert.equal((await listClaims(session)).length, 1);
  assert.equal(
    (
      await listClaims({
        ...session,
        context: { ...context, unit: { ...context.unit, id: "another-unit" } },
      })
    ).length,
    0,
  );
  assert.equal(
    (
      await listClaims({
        ...session,
        context: { ...context, user: { ...context.user, id: "another-user" } },
      })
    ).length,
    0,
  );
  await assert.rejects(saveClaim(session, { ...input, action: "submit" }), {
    code: "CLAIM_CONFLICT",
  });
  quantity = 1;
  await assert.rejects(
    saveClaim(session, { ...input, revision: 1, action: "submit" }),
    { code: "CLAIM_INVALID" },
  );
  quantity = 2;
  const submit = { ...input, revision: 1, action: "submit" };
  const saved = await saveClaim(session, submit);
  assert.equal(saved.claim.status, "submitted");
  assert.equal(saved.claim.parts[0].sku, "42");
  assert.deepEqual((await saveClaim(session, submit)).claim, saved.claim);
  await assert.rejects(saveClaim(session, { ...input, revision: 2 }), {
    code: "CLAIM_CONFLICT",
  });
});
