import { PortalError } from "./security";

/** Mirrors Buyer Portal's server-side Client/getAuthFromCookie transport. */
export function buyerHeaders(cookie: string): Record<string, string> {
  const name = "VtexIdclientAutCookie_volvoemea";
  const entry = cookie.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  const token = entry?.slice(name.length + 1);
  if (!token || /[\r\n]/.test(token)) {
    throw new PortalError(401, "VTEX_COOKIE_MISSING", "Please sign in again.");
  }
  return { Cookie: cookie, [name]: token, "Content-Type": "text/plain" };
}
