import "server-only";
import { cookies } from "next/headers";
import { readSession } from "./shared-sessions";
import { PortalError } from "./security";
export const SESSION_COOKIE = "volvo_portal_session";
export async function getSession() {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}
export async function requireSession() {
  const session = await getSession();
  if (!session)
    throw new PortalError(
      401,
      "SESSION_REQUIRED",
      "Your session has ended. Please sign in again.",
    );
  return session;
}
