import test from "node:test";
import assert from "node:assert/strict";
import {
  createSession,
  readSession,
  revokeSession,
  withSharedSession,
} from "../src/server/shared-sessions";
import { makePreviewContext } from "../src/domain/fixtures";
test("shared sessions persist across requests, serialize writers and revoke without resurrection", async (t) => {
  const previous = { ...process.env };
  Object.assign(process.env, { NODE_ENV: "production" });
  process.env.UPSTASH_REDIS_REST_URL = "https://redis.example";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test";
  t.after(() => {
    for (const k of [
      "NODE_ENV",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
    ]) {
      if (previous[k] === undefined) delete process.env[k];
      else process.env[k] = previous[k];
    }
  });
  const db = new Map<string, string>();
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: string, init: RequestInit) => {
      assert.equal(init.cache, "no-store");
      const c = JSON.parse(String(init.body));
      let result: unknown = null;
      if (c[0] === "SET") {
        if (!c.includes("NX") || !db.has(c[1])) {
          db.set(c[1], c[2]);
          result = "OK";
        }
      }
      if (c[0] === "GET") result = db.get(c[1]) ?? null;
      if (c[0] === "DEL") result = db.delete(c[1]) ? 1 : 0;
      if (c[0] === "EVAL") {
        const [, , , key, lock, owner, body] = c;
        if (db.get(lock) !== owner) result = 0;
        else {
          if (body && db.has(key)) db.set(key, body);
          db.delete(lock);
          result = 1;
        }
      }
      return Response.json({ result });
    },
  );
  const id = await createSession(makePreviewContext("buyer"), "server-secret");
  assert.equal(id.length, 43);
  await withSharedSession(id, async () => {
    const session = await readSession(id);
    session!.draft = [{ sku: "123", quantity: 2 }];
  });
  assert.equal((await readSession(id))?.draft?.[0].quantity, 2);
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  let entered!: () => void;
  const ready = new Promise<void>((r) => (entered = r));
  const first = withSharedSession(id, async () => {
    entered();
    await gate;
  });
  await ready;
  await assert.rejects(
    withSharedSession(id, async () => {}),
    { code: "SESSION_BUSY" },
  );
  release();
  await first;
  await assert.rejects(
    withSharedSession(id, async () => {
      (await readSession(id))!.draftRevision = 3;
      throw new Error("upstream failed");
    }),
  );
  assert.equal((await readSession(id))?.draftRevision, 3);
  await withSharedSession(id, async () => {
    await revokeSession(id);
    assert.equal(await readSession(id), undefined);
  });
  assert.equal(await readSession(id), undefined);
});
