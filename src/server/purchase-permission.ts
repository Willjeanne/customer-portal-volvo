import "server-only";
import { buyerHeaders } from "./buyer-headers";
import { PortalError } from "./security";
import type { PortalSession } from "./session-store";

// Resource documented in VTEX Storefront Roles; BFF transport matches FastStore's
// commerce.users.isResourceGranted. A role name or JWT is never an authorization.
export async function mayPlaceOrders(session: PortalSession): Promise<boolean> {
  if (session.context.mode !== "vtex" || !session.upstreamCookies)
    throw new PortalError(
      401,
      "LIVE_REQUIRED",
      "Sign in with VTEX to use the cart.",
    );
  const user = encodeURIComponent(session.context.user.id);
  let response: Response;
  try {
    response = await fetch(
      `https://volvoemea.vtexcommercestable.com.br/api/license-manager/storefront/bff/users/${user}/resources/PlaceOrders/granted?an=volvoemea`,
      {
        headers: {
          ...buyerHeaders(session.upstreamCookies),
          "Content-Type": "application/json",
          "X-FORWARDED-HOST": "www.emeafaststore.com",
        },
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(12000),
      },
    );
  } catch {
    throw new PortalError(
      502,
      "PURCHASE_CHECK_UNAVAILABLE",
      "VTEX could not verify purchasing permission. Try checking your list again.",
    );
  }
  if (!response.ok)
    throw new PortalError(
      response.status === 401 || response.status === 403 ? 403 : 502,
      "PURCHASE_CHECK_UNAVAILABLE",
      `Purchasing permission could not be verified (HTTP ${response.status}).`,
    );
  const result: unknown = await response.json().catch(() => null);
  if (typeof result !== "boolean")
    throw new PortalError(
      502,
      "PURCHASE_CHECK_FORMAT",
      "VTEX returned an unexpected purchasing permission response.",
    );
  return result;
}
