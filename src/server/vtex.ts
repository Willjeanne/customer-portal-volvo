import "server-only";
import { CookieJar } from "tough-cookie";
import { z } from "zod";
import type { BuyerContext } from "../domain/portal";
import { PortalError } from "./security";
import { buyerHeaders } from "./buyer-headers";
import { getBuyerProfile } from "./account";

const LOGIN_ORIGIN = "https://www.emeafaststore.com";
const BUYER_ORIGIN = "https://volvoemea.myvtex.com";
const AUTH = "/api/authenticator/v1";
const claimsSchema = z.object({
  userId: z.uuid(),
  customerId: z.uuid(),
  exp: z.number(),
  account: z.literal("volvoemea"),
});
const unitSchema = z.object({
  orgUnit: z.object({
    id: z.uuid(),
    name: z.string().min(1),
    path: z.object({ names: z.string().nullish() }).nullish(),
  }),
});

async function upstream(url: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(url, {
      ...options,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new PortalError(
      502,
      "VTEX_UNAVAILABLE",
      "VTEX could not be reached. No demo data has been substituted.",
    );
  }
}
async function loginRequest(
  jar: CookieJar,
  path: string,
  fields?: Record<string, string>,
): Promise<Response> {
  const url = LOGIN_ORIGIN + path;
  const body = fields ? new FormData() : undefined;
  if (body && fields)
    for (const [key, value] of Object.entries(fields)) body.set(key, value);
  const response = await upstream(url, {
    method: fields ? "POST" : "GET",
    body,
    headers: {
      Cookie: await jar.getCookieString(url),
      "vtex-id-ui-version": "customer-portal-volvo/local-validation",
    },
  });
  for (const cookie of response.headers.getSetCookie())
    await jar.setCookie(cookie, url);
  if (response.status === 429)
    throw new PortalError(
      429,
      "VTEX_RATE_LIMIT",
      "VTEX asks you to wait before trying again.",
    );
  if (![200, 201, 204, 302, 303, 307].includes(response.status)) {
    throw new PortalError(
      response.status === 401 ? 401 : 502,
      "VTEX_LOGIN_FAILED",
      "VTEX could not complete this sign-in. Check your access or use the existing store login.",
    );
  }
  return response;
}
/** Validate the signed-in buyer through their own context, not organization-admin access. */
export async function validateVtexSession(cookie: string) {
  const headers = buyerHeaders(cookie);
  const token = headers.VtexIdclientAutCookie_volvoemea;
  const claims = claimsSchema.parse(
    JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")),
  );
  if (claims.exp * 1000 <= Date.now())
    throw new PortalError(401, "VTEX_EXPIRED", "Please sign in again.");
  // Claims select the current user's resource only. The upstream service must authorize it.
  const response = await upstream(
    `${BUYER_ORIGIN}/_v/store-front/users/${claims.userId}/units`,
    { headers },
  );
  if (!response.ok)
    throw new PortalError(
      response.status === 401 || response.status === 403 ? 401 : 502,
      "VTEX_CONTEXT_FAILED",
      "Your signed-in account context could not be verified.",
    );
  const body: unknown = await response.json();
  const parsed = unitSchema.safeParse(body);
  if (!parsed.success) {
    console.warn(
      "VTEX context schema",
      parsed.error.issues.map(({ path, code }) => ({ path, code })),
    );
    throw new PortalError(
      502,
      "VTEX_CONTEXT_FORMAT",
      "Your account context returned an unexpected format.",
    );
  }
  const { orgUnit } = parsed.data;
  return { claims, orgUnit };
}

/** Local feasibility adapter, based on deployed login-alternative-key 1.11.3.
 * No app key, password persistence, token in URL, arbitrary proxy, or account mutation.
 * Production support and effective permissions remain separate acceptance gates.
 */
export async function signInVtex(
  username: string,
  password: string,
): Promise<{ context: BuyerContext; cookie: string }> {
  const jar = new CookieJar();
  await loginRequest(jar, `${AUTH}/pub/authentication/start`, {
    accountName: "volvoemea",
    scope: "volvoemea",
    returnUrl: `${LOGIN_ORIGIN}/`,
    user: username,
  });
  const identified = await loginRequest(jar, `${AUTH}/bff/storefront/signin`, {
    login: username,
  });
  const next = z
    .object({ nextStep: z.string() })
    .parse(await identified.json());
  if (next.nextStep !== "PasswordLogin")
    throw new PortalError(
      409,
      "HOSTED_LOGIN_REQUIRED",
      "This account requires the existing store login (SSO or password setup). No recovery email has been requested.",
    );
  const validated = await loginRequest(
    jar,
    `${AUTH}/pub/authentication/classic/validate`,
    { login: username, password },
  );
  const result = z
    .object({ authStatus: z.string() })
    .parse(await validated.json());
  if (result.authStatus !== "Success")
    throw new PortalError(
      401,
      "VTEX_CREDENTIALS_REJECTED",
      "VTEX did not accept this sign-in.",
    );
  // The redirect finalizes auth cookies. Never follow or expose its Location to the client.
  await loginRequest(
    jar,
    `${AUTH}/pub/authentication/redirect?returnUrl=${encodeURIComponent(LOGIN_ORIGIN + "/")}`,
  );
  const authCookies = (await jar.getCookies(LOGIN_ORIGIN)).filter((cookie) =>
    /^VtexIdclientAutCookie(?:_volvoemea)?$/.test(cookie.key),
  );
  const token = authCookies.find(
    (cookie) => cookie.key === "VtexIdclientAutCookie_volvoemea",
  )?.value;
  if (!token)
    throw new PortalError(
      502,
      "VTEX_COOKIE_MISSING",
      "The B2B login did not return the required account session.",
    );
  const cookie = authCookies
    .map((item) => `${item.key}=${item.value}`)
    .join("; ");
  const { claims, orgUnit } = await validateVtexSession(cookie);
  const context: BuyerContext = {
    mode: "vtex",
    user: {
      id: claims.userId,
      name: username,
      username,
      persona: "VTEX buyer session",
    },
    company: orgUnit.path?.names?.split("/").filter(Boolean)[0] || orgUnit.name,
    unit: { id: orgUnit.id, name: orgUnit.name },
    contract: claims.customerId,
    permissions: [],
    permissionsVerified: false,
    vehicle: "",
    urgency: "Normal",
  };
  // Display name from the shopper profile (same source as My Profile). Best effort:
  // a failed or empty read keeps the login, and never blocks the sign-in.
  try {
    const profile = await getBuyerProfile({
      context,
      upstreamCookies: cookie,
      expiresAt: 0,
    });
    if (profile.name) context.user.name = profile.name;
  } catch {}
  return { cookie, context };
}
