import Link from "next/link";
import type { PortalSession } from "@/server/session-store";
import { getBuyerProfile, listBuyerOrders } from "@/server/account";
import { PortalError } from "@/server/security";

function LoadError({ error, href }: { error: unknown; href: string }) {
  return <section className="detail-panel" role="alert"><h2>Information unavailable</h2><p>{error instanceof PortalError ? error.message : "The account service could not load this information."}</p><Link className="button secondary" href={href}>Try again</Link></section>;
}
export async function BuyerProfile({ session }: { session: PortalSession }) {
  const result = await getBuyerProfile(session).then(data => ({ data, error: null })).catch((error: unknown) => ({ data: null, error }));
  if (!result.data) return <LoadError error={result.error} href="/profile" />;
  const profile = result.data;
    return <section className="detail-panel"><span className="tag">VTEX ACCOUNT</span><h2>{profile.name || session.context.user.username}</h2><dl>
      <dt>Username</dt><dd>{session.context.user.username}</dd>
      <dt>Email</dt><dd>{profile.email || "Not provided"}</dd>
      <dt>Phone</dt><dd>{profile.phone || "Not provided"}</dd>
      <dt>Organization</dt><dd>{session.context.unit.name}</dd>
    </dl><p className="form-note">Read from your VTEX session. Profile editing is not connected yet.</p></section>;

}
export async function BuyerOrders({ session, page }: { session: PortalSession; page: number }) {
  const result = await listBuyerOrders(session, page).then(data => ({ data, error: null })).catch((error: unknown) => ({ data: null, error }));
  if (!result.data) return <LoadError error={result.error} href={`/orders?page=${page}`} />;
  const orders = result.data;
    return <section className="detail-panel"><span className="tag">VTEX ORDERS</span><h2>Your order history</h2><p>{orders.paging.total} orders available to your current account</p>
      {orders.list.length === 0 ? <p>No orders found on this page.</p> : <div style={{ overflowX: "auto" }}><table className="orders-table"><thead><tr><th>Order</th><th>Placed</th><th>Status</th><th>Total</th></tr></thead><tbody>{orders.list.map((order) => <tr key={order.orderId}><td><Link href={`/orders/${encodeURIComponent(order.orderId)}`}>{order.orderId}</Link></td><td>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Chicago" }).format(new Date(order.creationDate))}</td><td>{order.statusDescription || order.status}</td><td>{order.currencyCode ? new Intl.NumberFormat("en-US", { style: "currency", currency: order.currencyCode }).format(order.totalValue / 100) : `${(order.totalValue / 100).toFixed(2)} · currency unavailable`}</td></tr>)}</tbody></table></div>}
      <nav aria-label="Order pages" className="order-pagination">{page > 1 && <Link className="button secondary" href={`/orders?page=${page - 1}`}>Previous</Link>}<span>Page {page} of {Math.max(orders.paging.pages, 1)}</span>{page < orders.paging.pages && <Link className="button secondary" href={`/orders?page=${page + 1}`}>Next</Link>}</nav>
      <p className="form-note">Open an order for its items, shipment tracking and available invoices.</p>
    </section>;

}
