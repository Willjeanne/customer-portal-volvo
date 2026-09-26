import { insightOrderSchema } from "../domain/insights";
import "server-only";
import { quoteFilters, quoteListSchema } from "../domain/quotes";
import { orderDetailSchema, orderIdSchema } from "../domain/order";
import { z } from "zod";
import type { PortalSession } from "./session-store";
import { buyerHeaders } from "./buyer-headers";
import { PortalError } from "./security";

const field = z.object({ value: z.string().nullish() });
const sessionSchema = z.object({ namespaces: z.object({
  store: z.object({ currencyCode: field.optional() }).optional(),
  shopper: z.object({ firstName: field.optional(), lastName: field.optional() }).optional(),
  profile: z.object({ email: field.optional(), phone: field.optional() }).optional(),
  authentication: z.object({ storeUserId: field, storeUserEmail: field.optional() }),
}) });
const orderSchema = z.object({
  orderId: z.string().min(1), creationDate: z.string(),
  totalValue: z.number().finite(), status: z.string(), statusDescription: z.string().nullish(),
  currencyCode: z.string().regex(/^[A-Z]{3}$/).nullish(),
});
const ordersSchema = z.object({
  list: z.array(orderSchema),
  paging: z.object({ total: z.number().int().nonnegative(), pages: z.number().int().nonnegative(), currentPage: z.number().int(), perPage: z.number().int().positive() }),
});
async function read<T>(session: PortalSession, url: string, schema: z.ZodType<T>, method: "GET" | "POST" = "GET"): Promise<T> {
  if (session.context.mode !== "vtex" || !session.upstreamCookies)
    throw new PortalError(401, "LIVE_SESSION_REQUIRED", "Sign in with VTEX to view this information.");
  let response: Response;
  try {
    response = await fetch(url, {
      method, body: method === "POST" ? "{}" : undefined,
      headers: { ...buyerHeaders(session.upstreamCookies), "Content-Type": "application/json", "X-FORWARDED-HOST": "www.emeafaststore.com" },
      cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new PortalError(502, "ACCOUNT_UNAVAILABLE", "VTEX could not be reached. Please try again.");
  }
  if (response.status === 404) throw new PortalError(404, "ACCOUNT_NOT_FOUND", "This order could not be found for your account.");
  if (!response.ok)
    throw new PortalError(response.status === 401 || response.status === 403 ? 403 : 502, "ACCOUNT_READ_FAILED", response.status === 401 || response.status === 403 ? "This information is not available to your current account." : "VTEX could not load this information. Please try again.");
  const result = schema.safeParse(await response.json());
  if (!result.success) throw new PortalError(502, "ACCOUNT_FORMAT", "VTEX returned an unexpected response format.");
  return result.data;
}
export async function getBuyerProfile(session: PortalSession) {
  const data = await read(session, "https://volvoemea.vtexcommercestable.com.br/api/sessions?items=store.currencyCode,shopper.firstName,shopper.lastName,profile.email,profile.phone,authentication.storeUserId,authentication.storeUserEmail", sessionSchema, "POST");
  const { shopper, profile, authentication } = data.namespaces;
  if (authentication.storeUserId.value !== session.context.user.id)
    throw new PortalError(403, "PROFILE_SCOPE", "The returned profile does not match your session.");
  return {
    name: [shopper?.firstName?.value, shopper?.lastName?.value].filter(Boolean).join(" "),
    email: [profile?.email?.value, authentication.storeUserEmail?.value].find(value => typeof value === "string" && z.email().safeParse(value).success),
    phone: profile?.phone?.value,
    currency: z.string().regex(/^[A-Z]{3}$/).safeParse(data.namespaces.store?.currencyCode?.value).success ? data.namespaces.store?.currencyCode?.value : undefined,
  };
}

export function listBuyerOrders(session: PortalSession, page = 1) {
  const safePage = z.number().int().min(1).max(1000).parse(page);
  return read(session, `https://volvoemea.vtexcommercestable.com.br/api/oms/user/orders?page=${safePage}&per_page=10`, ordersSchema);
}

export async function getBuyerOrder(session: PortalSession, orderId: string) {
  const id = orderIdSchema.parse(orderId);
  const order = await read(session, `https://volvoemea.vtexcommercestable.com.br/api/oms/user/orders/${encodeURIComponent(id)}`, orderDetailSchema);
  if (order.orderId !== id) throw new PortalError(502, "ORDER_MISMATCH", "The returned order does not match your request.");
  return order;
}

export async function listBuyerQuotes(session: PortalSession, filters: {page:number;status?:string;label?:string}) {
  const input = quoteFilters.parse(filters);
  const params = new URLSearchParams({pageNumber:String(input.page),pageSize:"10"});
  if (input.status) params.set("status",input.status);
  if (input.label) params.set("label",input.label);
  return read(session, `https://volvoemea.vtexcommercestable.com.br/api/quoting/quotes?${params}`, quoteListSchema);
}

export async function getBuyerInsightOrder(session: PortalSession, orderId: string) {
  const id = orderIdSchema.parse(orderId);
  const order = await read(session, `https://volvoemea.vtexcommercestable.com.br/api/oms/user/orders/${encodeURIComponent(id)}`, insightOrderSchema);
  if (order.orderId !== id) throw new PortalError(502, "ORDER_MISMATCH", "The returned order does not match your request.");
  return order;
}
