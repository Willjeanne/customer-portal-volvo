import "server-only";
import { z } from "zod";
import { buyerHeaders } from "./buyer-headers";
import type { PortalSession } from "./session-store";
import { PortalError } from "./security";

const origin = "https://volvoemea.vtexcommercestable.com.br";
const field = z.object({ value: z.string() });
const scopeSchema = z.object({
  namespaces: z.object({
    authentication: z.object({ storeUserId: field }),
    profile: z.object({ email: field.optional() }).optional(),
    store: z.object({ currencyCode: field }).optional(),
  }),
});
const quoteSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  organizationId: z.string().min(1),
  creationDate: z.string(),
  expirationDate: z.string(),
  items: z.array(
    z.object({
      id: z.number().int(),
      name: z.string(),
      price: z.number().int().nonnegative(),
      quantity: z.number().int().positive(),
    }),
  ),
});

async function read<T>(
  session: PortalSession,
  path: string,
  schema: z.ZodType<T>,
  range?: string,
): Promise<T> {
  if (session.context.mode !== "vtex" || !session.upstreamCookies)
    throw new PortalError(
      401,
      "LIVE_REQUIRED",
      "Sign in with VTEX to view quotes.",
    );
  let response: Response;
  try {
    response = await fetch(origin + path, {
      headers: {
        ...buyerHeaders(session.upstreamCookies),
        "Content-Type": "application/json",
        "X-FORWARDED-HOST": "www.emeafaststore.com",
        ...(range ? { "REST-Range": range } : {}),
      },
      method: path.startsWith("/api/sessions?") ? "POST" : "GET",
      body: path.startsWith("/api/sessions?") ? "{}" : undefined,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new PortalError(
      502,
      "CUSTOM_QUOTES_UNAVAILABLE",
      "The store quote service could not be reached.",
    );
  }
  if (!response.ok)
    throw new PortalError(
      response.status === 401 || response.status === 403 ? 403 : 502,
      "CUSTOM_QUOTES_UNAVAILABLE",
      `Store quotes could not be loaded with this buyer session (HTTP ${response.status}).`,
    );
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success)
    throw new PortalError(
      502,
      "CUSTOM_QUOTES_FORMAT",
      "The store returned an unexpected quote response.",
    );
  return parsed.data;
}

export async function listStoreQuotes(
  session: PortalSession,
  filters: { page: number; status?: string; label: string },
) {
  const input = z
    .object({
      page: z.number().int().min(1).max(1000),
      status: z.enum(["pending", "expired"]).optional(),
      label: z.string().max(100),
    })
    .parse(filters);
  const scope = await read(
    session,
    "/api/sessions?items=authentication.storeUserId,profile.email,store.currencyCode",
    scopeSchema,
  );
  if (
    scope.namespaces.authentication.storeUserId.value !==
    session.context.user.id
  )
    throw new PortalError(
      403,
      "QUOTE_SCOPE",
      "The quote account could not be verified.",
    );
  // Existing createQuote stores person.email in organizationId. Never accept that
  // scope from the browser, and never use the unfiltered application-key resolver.
  const organization = scope.namespaces.profile?.email?.value;
  if (!organization)
    throw new PortalError(
      409,
      "QUOTE_ORGANIZATION_MISSING",
      "Your VTEX sign-in is valid, but the store has not supplied the organization context required for quotes (profile.email).",
    );
  if (
    !z.email().safeParse(organization).success ||
    /["'\\\r\n]/.test(organization)
  )
    throw new PortalError(
      403,
      "QUOTE_SCOPE",
      "The store quote organization could not be verified.",
    );
  const params = new URLSearchParams({
    _schema: "v1",
    _fields: "id,name,organizationId,creationDate,expirationDate,items",
    _where: `organizationId="${organization}"`,
    _sort: "creationDate DESC",
  });
  const quotes: z.infer<typeof quoteSchema>[] = [];
  // Bounded complete collection for client-requested name/status filters. Never
  // label a truncated collection as the complete history.
  for (let page = 0; page < 6; page++) {
    const batch = await read(
      session,
      `/api/dataentities/quotes/search?${params}`,
      z.array(quoteSchema),
      `resources=${page * 100}-${page * 100 + 99}`,
    );
    if (batch.some((quote) => quote.organizationId !== organization))
      throw new PortalError(
        403,
        "QUOTE_SCOPE",
        "The quote service returned data outside your organization.",
      );
    quotes.push(...batch);
    if (batch.length < 100) break;
    if (page === 5)
      throw new PortalError(
        502,
        "QUOTE_LIMIT",
        "The quote history is too large for this local view.",
      );
  }
  const now = Date.now();
  const items = quotes
    .map((quote) => ({
      id: quote.id,
      label: quote.name,
      status:
        new Date(quote.expirationDate).getTime() < now ? "expired" : "pending",
      createdAt: quote.creationDate,
      expiresAt: quote.expirationDate,
      amount:
        quote.items.reduce((sum, item) => sum + item.price * item.quantity, 0) /
        100,
    }))
    .filter(
      (quote) =>
        (!input.status || quote.status === input.status) &&
        quote.label.toLowerCase().includes(input.label.toLowerCase()),
    );
  const currency = scope.namespaces.store?.currencyCode.value;
  return {
    items: items.slice((input.page - 1) * 10, input.page * 10),
    totalItems: items.length,
    pageSize: 10,
    currency: currency && /^[A-Z]{3}$/.test(currency) ? currency : undefined,
  };
}
