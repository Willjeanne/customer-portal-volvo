import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, randomBytes } from "node:crypto";
import {
  sessions,
  SESSION_TTL_SECONDS,
  type PortalSession,
} from "./session-store";
import { PortalError } from "./security";

export const sharedEnabled = () => process.env.NODE_ENV === "production";
const active = new AsyncLocalStorage<{
  id: string;
  session?: PortalSession;
  revoked?: boolean;
}>();
const validId = (id?: string): id is string =>
  !!id && /^[A-Za-z0-9_-]{43}$/.test(id);
const key = (id: string) => `volvo:session:${id}`;
export async function redis(command: (string | number)[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token || new URL(url).protocol !== "https:")
    throw new PortalError(
      503,
      "SESSION_STORAGE",
      "Shared session storage is not configured.",
    );
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    const data = await response.json();
    if (!response.ok || data.error || !("result" in data)) throw new Error();
    return data.result;
  } catch {
    throw new PortalError(
      503,
      "SESSION_STORAGE",
      "Shared session storage is unavailable. No automatic retry was made.",
    );
  }
}
export async function readSession(
  id?: string,
): Promise<PortalSession | undefined> {
  if (!sharedEnabled()) return sessions.get(id);
  if (!validId(id)) return;
  const current = active.getStore();
  if (current?.id === id) return current.revoked ? undefined : current.session;
  const raw = await redis(["GET", key(id)]);
  if (typeof raw !== "string") return;
  const value = JSON.parse(raw) as PortalSession;
  if (
    !value.context ||
    !Number.isFinite(value.expiresAt) ||
    value.expiresAt <= Date.now()
  )
    return;
  return value;
}
export async function createSession(
  context: PortalSession["context"],
  cookie?: string,
) {
  if (!sharedEnabled()) return sessions.create(context, cookie);
  const id = randomBytes(32).toString("base64url");
  await redis([
    "SET",
    key(id),
    JSON.stringify({
      context,
      upstreamCookies: cookie,
      expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
    }),
    "EX",
    SESSION_TTL_SECONDS,
    "NX",
  ]);
  return id;
}
export async function revokeSession(id?: string) {
  if (!sharedEnabled()) return sessions.revoke(id);
  if (!validId(id)) return;
  const current = active.getStore();
  if (current?.id === id) current.revoked = true;
  await redis(["DEL", key(id)]);
}
const commit = `if redis.call('GET',KEYS[2]) ~= ARGV[1] then return 0 end
if ARGV[2] ~= '' and redis.call('EXISTS',KEYS[1]) == 1 then redis.call('SET',KEYS[1],ARGV[2],'PX',ARGV[3]) end
redis.call('DEL',KEYS[2]); return 1`;
export async function withSharedSession<T>(
  id: string | undefined,
  work: () => Promise<T>,
): Promise<T> {
  if (!sharedEnabled() || !validId(id)) return work();
  const lock = key(id) + ":lock",
    owner = randomBytes(24).toString("hex");
  if ((await redis(["SET", lock, owner, "NX", "EX", 180])) !== "OK")
    throw new PortalError(
      409,
      "SESSION_BUSY",
      "Another operation is in progress. Please try again shortly.",
    );
  let state: { id: string; session?: PortalSession; revoked?: boolean } = {
    id,
  };
  try {
    state = { id, session: await readSession(id) };
    return await active.run(state, work);
  } finally {
    const ttl = Math.max(1, (state.session?.expiresAt ?? 0) - Date.now());
    const body =
      !state.revoked && state.session && ttl > 1
        ? JSON.stringify(state.session)
        : "";
    if (
      (await redis(["EVAL", commit, 2, key(id), lock, owner, body, ttl])) !== 1
    )
      throw new PortalError(
        409,
        "SESSION_EXPIRED_OPERATION",
        "The operation outlasted its session lock. Refresh before continuing.",
      );
  }
}
export async function sharedLoginLimit(address: string) {
  const bucket = createHash("sha256").update(address).digest("hex");
  const count = await redis([
    "EVAL",
    "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n",
    1,
    `volvo:login:${bucket}`,
  ]);
  if (typeof count !== "number" || count > 5)
    throw new PortalError(
      429,
      "RATE_LIMIT",
      "Please wait a minute before trying again.",
    );
}
