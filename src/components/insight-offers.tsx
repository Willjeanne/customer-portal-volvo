"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import type { OfferComparison, PurchasedPart } from "@/domain/insights";
import { orderMoney } from "@/domain/order";
import { SaveToList } from "./save-to-list";

export function InsightOffers({ part }: { part: PurchasedPart }) {
  const [quantity, setQuantity] = useState(Math.min(9999, part.lastQuantity));
  const [compareQuantity, setCompareQuantity] = useState("");
  const [comparison, setComparison] = useState<OfferComparison | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function check(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setComparison(null);
    setMessage("");
    try {
      const response = await fetch("/api/portal/insight-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: part.lastOrderId,
          index: part.lastIndex,
          quantity,
          ...(compareQuantity
            ? { compareQuantity: Number(compareQuantity) }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not check this offer.");
      setComparison(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not check this offer.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function add(units: number) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/portal/draft-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line: { sku: part.sku, quantity: units } }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not add this part.");
      setMessage(
        `${units} unit(s) added to your saved draft. Open Quick Order to check the final seller, price and stock.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add this part.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="insights-offers" aria-label="Current offer comparison">
      <header>
        <p className="eyebrow">YOUR NEXT PURCHASE</p>
        <h3>Check today’s offer</h3>
        <p>
          Compare the same SKU and original seller. Your cart and saved
          preparation are unchanged by this check.
        </p>
      </header>
      <form onSubmit={check} className="insights-compare-form">
        <label>
          Quantity needed
          <input
            type="number"
            min={1}
            max={9999}
            required
            value={quantity}
            disabled={busy}
            onChange={(e) => {
              setQuantity(Number(e.target.value));
              setComparison(null);
            }}
          />
        </label>
        <label>
          Compare another quantity (optional)
          <input
            type="number"
            min={1}
            max={9999}
            value={compareQuantity}
            disabled={busy}
            onChange={(e) => {
              setCompareQuantity(e.target.value);
              setComparison(null);
            }}
            placeholder="e.g. 10"
          />
        </label>
        <button className="button primary" disabled={busy || !part.seller}>
          {busy ? "Checking…" : "Compare current offer"}
        </button>
      </form>
      {!part.seller && (
        <p>
          The original seller was not provided. Use Find Parts to check
          available offers.
        </p>
      )}
      {comparison && (
        <div aria-live="polite">
          <p className="form-note">
            Seller {comparison.seller} · Checked{" "}
            {new Date(comparison.checkedAt).toLocaleTimeString("en-US")} ·{" "}
            {comparison.currency}
          </p>
          <div className="insights-offer-grid">
            {comparison.offers.map((offer) => (
              <article key={offer.quantity} className="insights-offer-card">
                <h4>{offer.quantity} units</h4>
                {offer.total === null || offer.unitPrice === null ? (
                  <p>
                    No complete offer for this quantity. {offer.accepted} units
                    returned by simulation.
                  </p>
                ) : (
                  <>
                    <strong>
                      {orderMoney(offer.unitPrice, comparison.currency)} / unit
                    </strong>
                    <p>
                      Item total: {orderMoney(offer.total, comparison.currency)}
                    </p>
                    {comparison.historicalUnitPrice !== null && (
                      <p>
                        {offer.unitPrice < comparison.historicalUnitPrice
                          ? `${orderMoney(comparison.historicalUnitPrice - offer.unitPrice, comparison.currency)} less per unit than this past purchase`
                          : offer.unitPrice > comparison.historicalUnitPrice
                            ? `${orderMoney(offer.unitPrice - comparison.historicalUnitPrice, comparison.currency)} more per unit than this past purchase`
                            : "Same unit price as this past purchase"}
                        .
                      </p>
                    )}
                    {offer.benefits.length > 0 ? (
                      <p>Applied benefits: {offer.benefits.join(", ")}</p>
                    ) : (
                      <p className="form-note">
                        No named benefit returned for this offer.
                      </p>
                    )}
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => add(offer.quantity)}
                    >
                      Add {offer.quantity} to draft
                    </button>
                  </>
                )}
              </article>
            ))}
          </div>
          {comparison.offers.length === 2 &&
            comparison.offers.every((o) => o.unitPrice !== null) && (
              <p className="insights-callout">
                {comparison.offers[1].unitPrice! <
                comparison.offers[0].unitPrice!
                  ? `The second quantity is ${orderMoney(comparison.offers[0].unitPrice! - comparison.offers[1].unitPrice!, comparison.currency)} lower per unit. Compare the total commitment before buying more.`
                  : "No lower unit price was returned for the second quantity."}
              </p>
            )}
          <p className="form-note">
            Item-only simulation, without a delivery address or coupon.
            Shipping, taxes and final buying conditions must be confirmed in
            Quick Order and checkout. A lower price is not automatically a
            promotion or a quantity discount.
          </p>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {message && (
        <p role="status">
          {message} <Link href="/quick-order">Open Quick Order</Link>
        </p>
      )}
      <div className="insights-secondary-actions">
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => add(Math.min(9999, part.lastQuantity))}
        >
          Prepare last purchased quantity ({Math.min(9999, part.lastQuantity)})
        </button>
        <SaveToList
          lines={[
            { sku: part.sku, quantity: Math.min(9999, part.lastQuantity) },
          ]}
        />
      </div>
    </section>
  );
}
