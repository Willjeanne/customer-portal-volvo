import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { redis, sharedEnabled } from "./shared-sessions";
import type { PortalSession } from "./session-store";
import { PortalError } from "./security";
import type { OrderOutcome } from "../domain/checkout";
const schema = z.object({
  failure: z
    .object({
      stage: z.enum(["transaction", "payment", "processing"]),
      code: z.string(),
      httpStatus: z.number().optional(),
      upstreamCode: z.string().optional(),
    })
    .optional(),
  status: z.enum(["processing", "uncertain", "submitted"]),
  orderGroup: z.string().optional(),
  reference: z.string(),
  value: z.number(),
  currency: z.string(),
});
const local = new Map<string, OrderOutcome>();
function key(cart: string) {
  return `volvo:order-attempt:${createHash("sha256").update(cart).digest("hex")}`;
}
export async function orderStatus(
  session: PortalSession,
): Promise<OrderOutcome | null> {
  const cart = session.orderFormId || session.lastOrderCartId;
  if (!cart) return null;
  const raw = sharedEnabled()
    ? await redis(["GET", key(cart)])
    : local.get(key(cart));
  return raw
    ? schema.parse(typeof raw === "string" ? JSON.parse(raw) : raw)
    : null;
}
export async function claimOrder(cart: string, outcome: OrderOutcome) {
  // Persist BEFORE the irreversible call, independently of the session's final commit.
  // No expiry: an uncertain cart must never become eligible for a second purchase.
  if (sharedEnabled()) {
    if (
      (await redis(["SET", key(cart), JSON.stringify(outcome), "NX"])) === "OK"
    )
      return;
  } else if (!local.has(key(cart))) {
    local.set(key(cart), outcome);
    return;
  }
  throw new PortalError(
    409,
    "ORDER_ALREADY_ATTEMPTED",
    "This cart has already been submitted. Reload checkout to see its status.",
  );
}
export async function saveOrder(cart: string, outcome: OrderOutcome) {
  if (sharedEnabled()) await redis(["SET", key(cart), JSON.stringify(outcome)]);
  else local.set(key(cart), outcome);
}
export async function assertCartEditable(session: PortalSession) {
  if (session.orderFormId && (await orderStatus(session)))
    throw new PortalError(
      409,
      "ORDER_ALREADY_ATTEMPTED",
      "This cart has already been submitted. Check its order status before continuing.",
    );
}
