import { test } from "node:test";
import assert from "node:assert/strict";
import { SessionStore, SESSION_TTL_SECONDS } from "../src/server/session-store";
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
  assert.equal(SESSION_TTL_SECONDS, 4 * 60 * 60);
  assert.ok(store.get(id, 1000 + SESSION_TTL_SECONDS * 1000 - 1));
  assert.equal(store.get(id, 1000 + SESSION_TTL_SECONDS * 1000), undefined);
  const second = store.create(makePreviewContext("buyer"));
  store.revoke(second);
  assert.equal(store.get(second), undefined);
  assert.equal(store.get("forged"), undefined);
});
test("procurement cannot purchase and buyer cannot access approvals, including direct routes", () => {
  // >>> CLAUDE — lot find parts, 20/09/2026 — à relire
  // La découverte de pièces n'est plus conditionnée à `purchase` ; la frontière
  // qui compte est l'approbation, vérifiée juste en dessous, et l'achat lui-même,
  // couvert par tests/purchase-permission.test.ts.
  assert.equal(canVisit(makePreviewContext("procurement"), "parts"), true);
  // <<< CLAUDE
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

test("production requires configured shared storage and exact demo origin", () => {
  const before = { ...process.env };
  try {
    process.env.PORTAL_ORIGIN = "https://customer-portal-volvo.vercel.app";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    assert.throws(() => assertLocalRuntime("production"));
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test";
    assert.doesNotThrow(() => assertLocalRuntime("production"));
    const req = (origin: string) =>
      new Request("https://customer-portal-volvo.vercel.app/api/portal/login", {
        method: "POST",
        headers: { origin, "Content-Type": "application/json" },
      });
    assert.doesNotThrow(() =>
      assertMutationOrigin(req(process.env.PORTAL_ORIGIN!)),
    );
    assert.throws(() => assertMutationOrigin(req("https://other.vercel.app")));
  } finally {
    for (const k of [
      "PORTAL_ORIGIN",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
    ]) {
      if (before[k] === undefined) delete process.env[k];
      else process.env[k] = before[k];
    }
  }
});
