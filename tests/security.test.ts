import { test } from "node:test";
import assert from "node:assert/strict";
import { SessionStore } from "../src/server/session-store";
import { makePreviewContext } from "../src/domain/fixtures";
import { canVisit } from "../src/domain/portal";
import {
  assertMutationOrigin,
  assertLocalRuntime,
} from "../src/server/security";

test("opaque sessions expire, revoke, and never serialize upstream credentials into buyer context", () => {
  const store = new SessionStore();
  const id = store.create(
    makePreviewContext("buyer"),
    "server-only-test-cookie",
    1000,
  );
  assert.equal(id.length, 43);
  assert.ok(store.get(id, 1001));
  assert.ok(
    !JSON.stringify(store.get(id, 1001)?.context).includes(
      "server-only-test-cookie",
    ),
  );
  assert.equal(store.get(id, 1_801_000), undefined);
  const second = store.create(makePreviewContext("buyer"));
  store.revoke(second);
  assert.equal(store.get(second), undefined);
  assert.equal(store.get("forged"), undefined);
});
test("procurement cannot purchase and buyer cannot access approvals, including direct routes", () => {
  assert.equal(
    canVisit(makePreviewContext("procurement"), "parts"),
    false,
  );
  assert.equal(canVisit(makePreviewContext("buyer"), "approvals"), false);
  assert.equal(canVisit(makePreviewContext("approver"), "approvals"), true);
  assert.equal(canVisit(makePreviewContext("buyer"), "invented-route"), false);
});
test("CSRF boundary rejects missing origin, hostile origin and form submissions", () => {
  const request = (origin?: string, type = "application/json") =>
    new Request("http://127.0.0.1:3000/api/portal/context", {
      method: "POST",
      headers: { ...(origin ? { origin } : {}), "content-type": type },
    });
  assert.throws(() => assertMutationOrigin(request()));
  assert.throws(() => assertMutationOrigin(request("https://evil.example")));
  assert.throws(() =>
    assertMutationOrigin(request("http://127.0.0.1:3000", "text/plain")),
  );
  assert.doesNotThrow(() =>
    assertMutationOrigin(request("http://127.0.0.1:3000")),
  );
});
test("local authentication fails closed in production", () => {
  assert.throws(() => assertLocalRuntime("production"));
  assert.doesNotThrow(() => assertLocalRuntime("development"));
});
