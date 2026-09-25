import { SaveToList } from "@/components/save-to-list";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { getBuyerOrder } from "@/server/account";
import { validateVtexSession } from "@/server/vtex";
import { PortalError } from "@/server/security";
import { documentLink, orderIdSchema, orderMoney } from "@/domain/order";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!orderIdSchema.safeParse(orderId).success) notFound();
  const session = await getSession();
  if (!session) redirect("/login");
  const result = await (async () => {
    if (session.context.mode !== "vtex") throw new PortalError(401, "LIVE_REQUIRED", "Sign in with VTEX to view an order.");
    await validateVtexSession(session.upstreamCookies || "");
    return getBuyerOrder(session, orderId);
  })().then(data => ({ data, error: null })).catch((error: unknown) => ({ data: null, error }));
  const order = result.data;
  return <Shell context={session.context}>
    <Link href="/orders" className="button secondary">Back to orders</Link>
    <p className="eyebrow">ORDER DETAILS</p><h1>Order {orderId}</h1>
    {!order ? <section className="detail-panel" role="alert"><h2>{result.error instanceof PortalError && result.error.status === 404 ? "Order not found" : "Order unavailable"}</h2><p>{result.error instanceof PortalError ? result.error.message : "This order could not be loaded. Please try again."}</p></section> : <>
      <section className="detail-panel"><h2>{order.statusDescription || order.status}</h2><dl><dt>Placed</dt><dd>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Chicago" }).format(new Date(order.creationDate))}</dd><dt>Total</dt><dd>{orderMoney(order.value, order.storePreferencesData?.currencyCode)}</dd></dl></section>
      <SaveToList orderId={order.orderId} />
      <section className="detail-panel"><h2>Items</h2><Link className="button secondary" href={`/quick-order?order=${encodeURIComponent(order.orderId)}`}>Prepare reorder</Link><div style={{ overflowX: "auto" }}><table className="orders-table"><thead><tr><th>Part</th><th>Reference</th><th>Quantity</th><th>Unit price</th></tr></thead><tbody>{order.items.map((item, index) => <tr key={`${item.id}-${index}`}><td>{item.name}</td><td>{item.refId || item.id}</td><td>{item.quantity}</td><td>{orderMoney(item.sellingPrice, order.storePreferencesData?.currencyCode)}</td></tr>)}</tbody></table></div></section>
      <section className="detail-panel"><h2>Shipments & documents</h2>{!order.packageAttachment?.packages?.length ? <p>No shipment or invoice has been provided yet.</p> : order.packageAttachment.packages.map((shipment, index) => {
        const invoice = documentLink(shipment.invoiceUrl); const tracking = documentLink(shipment.trackingUrl);
        return <article key={index}><h3>Shipment {index + 1}</h3><p>{shipment.courier || "Carrier not provided"} · {shipment.trackingNumber || "Tracking number pending"}</p><p>Invoice: {shipment.invoiceNumber || "Not provided"}</p><div className="order-pagination">{tracking && <a className="button secondary" href={tracking} target="_blank" rel="noopener noreferrer">Track shipment</a>}{invoice && <a className="button secondary" href={invoice} target="_blank" rel="noopener noreferrer">Open invoice</a>}</div></article>;
      })}</section>
    </>}
  </Shell>;
}
