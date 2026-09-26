import { listClaims } from "@/server/claims";
import { orderStatusLabel } from "@/domain/order";
import Link from "next/link";
import { getBuyerOrder, listBuyerOrders } from "@/server/account";
import type { PortalSession } from "@/server/session-store";
import { PortalError } from "@/server/security";
import { orderIdSchema, orderMoney } from "@/domain/order";
import { ClaimForm } from "./claim-form";
export async function Claims({
  session,
  orderId,
  requestId,
  page,
}: {
  session: PortalSession;
  orderId?: string;
  requestId?: string;
  page: number;
}) {
  if (session.context.mode !== "vtex")
    return (
      <section className="detail-panel">
        <p>Sign in with VTEX to prepare a request from your orders.</p>
      </section>
    );
  const result = await (async () => {
    const requests = await listClaims(session);
    const selected = requestId
      ? requests.find((r) => r.id === requestId)
      : undefined;
    if (requestId && !selected)
      throw new PortalError(
        404,
        "CLAIM_NOT_FOUND",
        "Request not found in your current account.",
      );
    if (selected?.status === "submitted")
      return { order: null, orders: null, requests, selected };
    const targetOrderId = selected?.orderId || orderId;
    if (targetOrderId) {
      if (!orderIdSchema.safeParse(targetOrderId).success)
        throw new PortalError(400, "ORDER_INVALID", "Choose a valid order.");
      return {
        order: await getBuyerOrder(session, targetOrderId),
        orders: null,
        requests,
        selected,
      };
    }
    return {
      order: null,
      orders: await listBuyerOrders(session, page),
      requests,
      selected,
    };
  })()
    .then((data) => ({ data, error: null }))
    .catch((error: unknown) => ({ data: null, error }));
  if (!result.data) {
    const error = result.error;
    return (
      <section className="detail-panel" role="alert">
        <h2>Orders unavailable</h2>
        <p>
          {error instanceof PortalError
            ? error.message
            : "Order information could not be loaded."}
        </p>
        <Link href="/claims">Back to orders</Link>
      </section>
    );
  }
  const { order, orders, requests, selected } = result.data;
  if (selected?.status === "submitted")
    return (
      <section className="detail-panel claim-form">
        <h2>{selected.draft.subject}</h2>
        <p>{selected.reference}</p>
        <p>Submitted · Demo request · {selected.updatedAt.slice(0, 10)}</p>
        <p>
          Order {selected.orderId} · {selected.draft.reason} ·{" "}
          {selected.draft.resolution}
        </p>
        <ul>
          {selected.parts.map((p) => (
            <li key={p.index}>
              {p.name} · SKU {p.sku} · Quantity: {p.quantity}
            </li>
          ))}
        </ul>
        <p className="claim-description">{selected.draft.description}</p>
        <p>
          This demo request is recorded in the portal only. No Volvo case,
          return authorization or refund has been created.
        </p>
        <Link href="/claims">Back to request history</Link>
      </section>
    );
  if (order) {
    return (
      <>
        <p>
          <Link href="/claims">Choose another order</Link>
        </p>
        <section className="detail-panel">
          <h2>Order {order.orderId}</h2>
          <p>
            {orderStatusLabel(order.status)} ·{" "}
            {orderMoney(order.value, order.storePreferencesData?.currencyCode)}
          </p>
          <p>Prepare a return or report an issue for this order.</p>
        </section>
        <ClaimForm
          key={selected?.id || order.orderId}
          order={order}
          initial={selected}
        />
      </>
    );
  }
  if (!orders) return null;
  return (
    <>
      <section className="detail-panel claim-form">
        <h2>Your requests</h2>
        <p>Demo dossiers for your current user and organization unit.</p>
        {process.env.NODE_ENV !== "production" && (
          <p className="form-note">
            Local demo: saved requests last until the server restarts. Deployed
            requests use shared storage.
          </p>
        )}
        {!requests.length && <p>No saved requests yet.</p>}
        {requests.map((request) => (
          <article className="replenishment-list-card" key={request.id}>
            <h3>{request.draft.subject}</h3>
            <p>
              {request.status === "draft" ? "Draft" : "Submitted · Demo"} ·
              Order {request.orderId} · {request.updatedAt.slice(0, 10)}
            </p>
            <Link
              className="button secondary"
              href={`/claims?request=${request.id}`}
            >
              {request.status === "draft" ? "Resume draft" : "View request"}
            </Link>
          </article>
        ))}
      </section>
      <section className="detail-panel claim-form">
        <h2>Start a return or claim</h2>
        <p>Choose an order to select the parts and describe your request.</p>
        {!orders.list.length && <p>No orders available for this account.</p>}
        {orders.list.map((order) => (
          <article className="replenishment-list-card" key={order.orderId}>
            <h3>Order {order.orderId}</h3>
            <p>
              {order.creationDate.slice(0, 10)} ·{" "}
              {orderStatusLabel(order.status)}
            </p>
            <p>{orderMoney(order.totalValue, order.currencyCode)}</p>
            <Link
              className="button secondary"
              href={`/claims?order=${encodeURIComponent(order.orderId)}`}
            >
              Return or report an issue
            </Link>
          </article>
        ))}
        <nav aria-label="Order pages">
          {page > 1 && (
            <Link href={`/claims?page=${page - 1}`}>Previous page</Link>
          )}{" "}
          <span>Page {page}</span>{" "}
          {page < orders.paging.pages && (
            <Link href={`/claims?page=${page + 1}`}>Next page</Link>
          )}
        </nav>
        <p className="form-note">
          Demo requests are recorded in the portal only. No return or refund is
          initiated here.
        </p>
      </section>
    </>
  );
}
