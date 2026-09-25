import { randomBytes } from "node:crypto";
import type { BuyerContext } from "../domain/portal";
/** Absolute portal session lifetime. The VTEX token expiry is still enforced on every request. */
export const SESSION_TTL_SECONDS = 4 * 60 * 60;
export interface PortalSession {
  context: BuyerContext;
  expiresAt: number;
  upstreamCookies?: string;
  checkoutCookies?: string;
  orderFormId?: string;
  lastOrderCartId?: string;
  cartBusy?: boolean;
  preparation?: import("../domain/cart").Preparation & {
    channel: string;
    unitId: string;
  };
  draftRevision?: number;
  draft?: import("../domain/order-draft").DraftLine[];
}
export class SessionStore {
  private sessions = new Map<string, PortalSession>();
  create(
    context: BuyerContext,
    upstreamCookies?: string,
    now = Date.now(),
  ): string {
    this.prune(now);
    if (this.sessions.size >= 200) throw new Error("Session capacity reached");
    const id = randomBytes(32).toString("base64url");
    this.sessions.set(id, {
      context: structuredClone(context),
      upstreamCookies,
      expiresAt: now + SESSION_TTL_SECONDS * 1000,
    });
    return id;
  }
  get(id: string | undefined, now = Date.now()): PortalSession | undefined {
    if (!id) return;
    const session = this.sessions.get(id);
    if (session && session.expiresAt > now) return session;
    this.sessions.delete(id);
  }
  revoke(id: string | undefined): void {
    if (id) this.sessions.delete(id);
  }
  private prune(now: number): void {
    for (const [id, value] of this.sessions)
      if (value.expiresAt <= now) this.sessions.delete(id);
  }
}
const localGlobal = globalThis as typeof globalThis & {
  volvoSessions?: SessionStore;
};
// Single-process local runtime ONLY. Production login is disabled until a shared store is selected.
export const sessions = (localGlobal.volvoSessions ??= new SessionStore());
