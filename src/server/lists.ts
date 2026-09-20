import "server-only";
import { z } from "zod";
import type { PortalSession } from "./session-store";
import { buyerHeaders } from "./buyer-headers";
import { PortalError } from "./security";
const listSchema = z.object({ id: z.string().min(1), name: z.string(), description: z.string().nullish(), itemCount: z.number().int().nonnegative().nullish(), status: z.string() });
const itemSchema = z.object({ id: z.string(), skuId: z.string(), preferredQuantity: z.number().int().min(1).max(9999) });
const provider = '@context(provider: "vtex.replenishment-service@1.x")';
async function query<T>(session: PortalSession, query: string, schema: z.ZodType<T>, variables: Record<string,string> = {}) {
  if (session.context.mode !== "vtex" || !session.upstreamCookies) throw new PortalError(401,"LIVE_REQUIRED","Sign in with VTEX to view replenishment lists.");
  let response: Response;
  try { response = await fetch("https://www.emeafaststore.com/_v/private/graphql/v1", { method:"POST", headers:{ ...buyerHeaders(session.upstreamCookies), "Content-Type":"application/json", "x-vtex-app-id":"vtex.replenishment-service@1.x", Origin:"https://www.emeafaststore.com" }, body:JSON.stringify({query,variables}), cache:"no-store", redirect:"manual", signal:AbortSignal.timeout(12000) }); }
  catch { throw new PortalError(502,"LISTS_UNAVAILABLE","The lists service could not be reached."); }
  if (!response.ok) throw new PortalError(response.status === 403 || response.status === 401 ? 403 : 502,"LISTS_UNAVAILABLE",`Replenishment lists are unavailable for this session (HTTP ${response.status}).`);
  const payload: unknown = await response.json();
  const parsed = z.object({ data:schema.nullish(), errors:z.array(z.unknown()).optional() }).safeParse(payload);
  if (!parsed.success || parsed.data.errors?.length || !parsed.data.data) throw new PortalError(502,"LISTS_RESPONSE","The lists service could not return your data. Please try again.");
  return parsed.data.data;
}
export async function getBuyerLists(session: PortalSession) {
  return (await query(session, `query PortalLists { getLists ${provider} { id name description itemCount status } }`, z.object({getLists:z.array(listSchema)}))).getLists;
}
export async function getBuyerListItems(session: PortalSession, id: string) {
  const listId = z.string().regex(/^[A-Za-z0-9-]{1,80}$/).parse(id);
  return (await query(session, `query PortalListItems($listId: ID!) { getListItems(listId: $listId) ${provider} { id skuId preferredQuantity } }`, z.object({getListItems:z.array(itemSchema).max(200)}), {listId})).getListItems;
}
