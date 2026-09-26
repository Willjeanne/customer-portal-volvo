import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { claimDraftSchema, validateClaimDraft } from "@/domain/claim";
import { orderIdSchema } from "@/domain/order";
import type { SavedClaim } from "@/domain/claim";
import type { PortalSession } from "./session-store";
import { getBuyerOrder } from "./account";
import { PortalError } from "./security";
import { redis, sharedEnabled } from "./shared-sessions";

const local = new Map<string, Map<string, SavedClaim>>();
export function claimOwnerKey(session: PortalSession) {
  if (session.context.mode !== "vtex")
    throw new PortalError(403, "CLAIM_AUTH", "Sign in with VTEX first.");
  const c = session.context;
  return `volvo:demo-claims:${createHash("sha256")
    .update(JSON.stringify([c.user.id, c.unit.id, c.contract]))
    .digest("hex")}`;
}
export async function listClaims(
  session: PortalSession,
): Promise<SavedClaim[]> {
  const key = claimOwnerKey(session);
  const raw = sharedEnabled() ? await redis(["HVALS", key]) : null;
  const values: SavedClaim[] = sharedEnabled()
    ? (raw as string[]).map((value) => JSON.parse(value) as SavedClaim)
    : [...(local.get(key)?.values() || [])];
  return values.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
const inputSchema = z
  .object({
    id: z.string().uuid(),
    revision: z.number().int().nonnegative(),
    orderId: orderIdSchema,
    action: z.enum(["draft", "submit"]),
    draft: claimDraftSchema,
  })
  .strict();
export async function saveClaim(session: PortalSession, input: unknown) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success)
    throw new PortalError(400, "CLAIM_INVALID", "Check the request fields.");
  const data = parsed.data;
  const key = claimOwnerKey(session);
  const order = await getBuyerOrder(session, data.orderId);
  const checked = validateClaimDraft(data.draft, order.items);
  if (checked.error) throw new PortalError(400, "CLAIM_INVALID", checked.error);
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
  const now = new Date().toISOString();
  const record: SavedClaim = {
    id: data.id,
    reference: `DEMO-${data.id}`,
    orderId: data.orderId,
    revision: data.revision + 1,
    status: data.action === "submit" ? "submitted" : "draft",
    updatedAt: now,
    draft: data.draft,
    fingerprint,
    parts: data.draft.lines.map((line) => ({
      ...line,
      sku: order.items[line.index].id,
      name: order.items[line.index].name,
    })),
  };
  if (sharedEnabled()) {
    const result = await redis([
      "EVAL",
      `
      local old = redis.call('HGET', KEYS[1], ARGV[1])
      if old then
        local previous = cjson.decode(old)
        if previous.fingerprint == ARGV[4] then return old end
        if previous.status ~= 'draft' or previous.revision ~= tonumber(ARGV[2]) then return 'conflict' end
      elseif tonumber(ARGV[2]) ~= 0 then return 'conflict'
      elseif redis.call('HLEN', KEYS[1]) >= 100 then return 'limit' end
      redis.call('HSET', KEYS[1], ARGV[1], ARGV[3])
      return ARGV[3]
    `,
      1,
      key,
      data.id,
      data.revision,
      JSON.stringify(record),
      fingerprint,
    ]);
    if (result === "limit")
      throw new PortalError(
        409,
        "CLAIM_LIMIT",
        "This demo account has reached 100 requests.",
      );
    if (result === "conflict")
      throw new PortalError(
        409,
        "CLAIM_CONFLICT",
        "This request has changed or was submitted. Reopen it from request history.",
      );
    return { claim: JSON.parse(result as string) as SavedClaim };
  }
  const records = local.get(key) || new Map<string, SavedClaim>();
  const previous = records.get(data.id);
  if (previous?.fingerprint === fingerprint) return { claim: previous };
  if (
    (previous &&
      (previous.status !== "draft" || previous.revision !== data.revision)) ||
    (!previous && data.revision !== 0)
  )
    throw new PortalError(
      409,
      "CLAIM_CONFLICT",
      "This request has changed or was submitted. Reopen it from request history.",
    );
  if (!previous && records.size >= 100)
    throw new PortalError(
      409,
      "CLAIM_LIMIT",
      "This demo account has reached 100 requests.",
    );
  records.set(data.id, record);
  local.set(key, records);
  return { claim: record };
}
