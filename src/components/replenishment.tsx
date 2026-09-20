import Link from "next/link";
import { getBuyerLists, getBuyerListItems } from "@/server/lists";
import { getBuyerOrder } from "@/server/account";
import type { PortalSession } from "@/server/session-store";
import { PortalError } from "@/server/security";
import { draftCsv, parseOrderCsv } from "@/domain/order-draft";
import { QuickOrder } from "./quick-order";
export async function ReplenishmentLists({
  session,
}: {
  session: PortalSession;
}) {
  if (session.context.mode === "preview")
    return (
      <section className="detail-panel">
        <h2>Replenishment lists</h2>
        <p>Sign in with VTEX to load saved lists.</p>
        <Link className="button secondary" href="/quick-order">
          Prepare a draft
        </Link>
      </section>
    );
  const result = await getBuyerLists(session)
    .then((data) => ({ data, error: null }))
    .catch((error: unknown) => ({ data: null, error }));
  if (!result.data)
    return (
      <section className="detail-panel" role="alert">
        <h2>Lists unavailable</h2>
        <p>
          {result.error instanceof PortalError
            ? result.error.message
            : "Lists could not be loaded."}
        </p>
        <Link href="/lists">Try again</Link>
      </section>
    );
  return (
    <section className="detail-panel">
      <h2>Your saved lists</h2>
      {!result.data.length ? (
        <p>No replenishment lists found.</p>
      ) : (
        result.data.map((list) => (
          <article key={list.id}>
            <h3>{list.name}</h3>
            <p>{list.description}</p>
            <p>
              {list.itemCount ?? "—"} parts · {list.status}
            </p>
            <Link
              className="button secondary"
              href={`/quick-order?list=${encodeURIComponent(list.id)}`}
            >
              Prepare from this list
            </Link>
          </article>
        ))
      )}
      <p className="form-note">
        Lists are read from VTEX. Preparing a draft does not modify a saved
        list.
      </p>
    </section>
  );
}
export async function Preparation({
  session,
  orderId,
  listId,
}: {
  session: PortalSession;
  orderId?: string;
  listId?: string;
}) {
  // >>> CLAUDE — lot flotte, 20/09/2026 — à relire
  // Un brouillon déjà enregistré en session est rechargé d'office, sinon l'ajout
  // depuis une fiche véhicule mène à une page qui paraît vide. Le bouton
  // « Restore saved draft » reste disponible et inchangé.
  if (!orderId && !listId)
    return session.draft?.length ? (
      <QuickOrder
        initialRevision={session.draftRevision ?? 0}
        initialLines={session.draft}
        source="From your saved preparation"
      />
    ) : (
      <QuickOrder initialRevision={session.draftRevision ?? 0} />
    );
  // <<< CLAUDE
  const result = await (async () => {
    const lines = orderId
      ? (await getBuyerOrder(session, orderId)).items.map((item) => ({
          sku: item.id,
          quantity: item.quantity,
        }))
      : (await getBuyerListItems(session, listId!)).map((item) => ({
          sku: item.skuId,
          quantity: item.preferredQuantity,
        }));
    const parsed = parseOrderCsv(draftCsv(lines));
    if (parsed.errors.length)
      throw new PortalError(400, "INVALID_DRAFT", parsed.errors.join(" "));
    return parsed.lines;
  })()
    .then((data) => ({ data, error: null }))
    .catch((error: unknown) => ({ data: null, error }));
  if (!result.data)
    return (
      <section className="detail-panel" role="alert">
        <h2>Draft unavailable</h2>
        <p>
          {result.error instanceof PortalError
            ? result.error.message
            : "The selected source could not be loaded."}
        </p>
        <Link href="/quick-order">Start a blank draft</Link>
      </section>
    );
  return (
    <QuickOrder
      initialRevision={session.draftRevision ?? 0}
      key={orderId || listId}
      initialLines={result.data}
      source={
        orderId ? `From order ${orderId}` : "From your VTEX replenishment list"
      }
    />
  );
}
