"use client";
import { useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import type { PurchasingReport } from "@/domain/insights";
import { orderMoney } from "@/domain/order";
import { InsightProduct } from "./insight-product";
import { InsightOffers } from "./insight-offers";

export function PurchasingInsights({ report }: { report: PurchasingReport }) {
  const [selected, setSelected] = useState(report.parts[0]?.key || "");
  const part = report.parts.find((p) => p.key === selected);
  const recurring = report.parts.filter((p) => p.orderIds.length > 1);
  const categories = [...new Set(report.parts.map((p) => p.category))];
  function exportCsv() {
    const text = Papa.unparse(
      report.parts.map((p) => ({
        SKU: p.sku,
        Reference: p.reference || "",
        Product: p.name,
        Category: p.category,
        Seller: p.seller || "",
        Currency: p.currency || "Unknown",
        Quantity: p.quantity,
        Orders: p.orderIds.length,
        ItemAmount: (p.amount / 100).toFixed(2),
        SourceOrders: p.orderIds.join("; "),
      })),
      { escapeFormulae: true },
    );
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "purchasing-insights.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <div className="insights-scope">
        <strong>
          {report.scope.user} · {report.scope.unit}
        </strong>
        <span>
          {report.coverage.analyzed} orders analyzed · Updated{" "}
          {new Date(report.updatedAt).toLocaleDateString("en-US", {
            timeZone: "UTC",
          })}{" "}
          (UTC)
        </span>
        <p>
          Orders accessible to your login, not a company-wide spend report.
          Cancelled and cancellation-requested orders are excluded. Amounts are
          ordered values, not confirmed payments.
        </p>
        {(report.coverage.truncated || report.coverage.failed > 0) && (
          <p role="status">
            <strong>Partial history:</strong> {report.coverage.scanned} of{" "}
            {report.coverage.totalAccessible} accessible orders scanned (maximum
            30); {report.coverage.failed} details unavailable. All insights
            describe this sample only.
          </p>
        )}
      </div>
      {!report.parts.length ? (
        <section className="detail-panel">
          <h2>No purchases to analyze in this period</h2>
          <p>
            Try a wider period or check Orders with the same login. Unavailable
            history is never replaced with sample savings.
          </p>
          <Link className="button secondary" href="/orders">
            View orders
          </Link>
        </section>
      ) : (
        <>
          <div className="insights-metrics">
            <article>
              <span>Purchased references</span>
              <strong>{new Set(report.parts.map((p) => p.sku)).size}</strong>
              <p>Across the analyzed orders</p>
            </article>
            <article>
              <span>Repeat purchases</span>
              <strong>{recurring.length}</strong>
              <p>SKU / seller combinations bought more than once</p>
            </article>
            <article>
              <span>Product families</span>
              <strong>
                {categories.filter((c) => c !== "Unclassified").length}
              </strong>
              <p>
                {
                  report.parts.filter((p) => p.category === "Unclassified")
                    .length
                }{" "}
                entries without category data
              </p>
            </article>
          </div>
          <section className="detail-panel insights-section">
            <div className="insights-section-heading">
              <div>
                <p className="eyebrow">UNDERSTAND YOUR SAVINGS</p>
                <h2>Recorded order discounts</h2>
              </div>
              <a href="#discount-evidence">See source orders ↓</a>
            </div>
            <div className="insights-metrics">
              {report.currencies.map((c) => (
                <article key={c.currency || "unknown"}>
                  <span>{c.currency || "Currency unavailable"}</span>
                  <strong>
                    {c.discountOrders && c.currency
                      ? orderMoney(c.discounts, c.currency)
                      : "Not available"}
                  </strong>
                  <p>
                    Discount totals available for {c.discountOrders} of{" "}
                    {c.orders} orders
                  </p>
                  <p>
                    Item value:{" "}
                    {c.currency
                      ? orderMoney(c.itemAmount, c.currency)
                      : "Unavailable without currency"}
                  </p>
                </article>
              ))}
            </div>
            <p className="form-note">
              Recorded Discounts totals only. Catalogue price differences and
              benefit tags are not added to this amount. Discounts can include
              adjustments; only linked benefit names are shown below. Returns
              and refunds are not deducted.
            </p>
          </section>
          <section className="detail-panel insights-section">
            <div className="insights-section-heading">
              <div>
                <p className="eyebrow">PLAN YOUR NEXT PURCHASE</p>
                <h2>Your purchased parts</h2>
              </div>
              <button className="button secondary" onClick={exportCsv}>
                Export CSV
              </button>
            </div>
            <p>
              Select a part to explore its purchase history and compare today’s
              offer. Quantities across different products are not treated as
              equivalent consumption.
            </p>
            <div className="insights-parts-grid">
              <div className="insights-part-list" aria-label="Purchased parts">
                {report.parts.map((p) => (
                  <button
                    key={p.key}
                    className={`insights-part-option${p.key === selected ? " is-selected" : ""}`}
                    aria-pressed={p.key === selected}
                    onClick={() => setSelected(p.key)}
                  >
                    <strong>{p.name}</strong>
                    <span>
                      SKU {p.sku} · {p.orderIds.length} orders · {p.quantity}{" "}
                      units
                    </span>
                    <small>
                      {p.category} · {p.currency || "Currency unknown"}
                    </small>
                  </button>
                ))}
              </div>
              {part && (
                <div className="insights-part-detail">
                  <h3>{part.name}</h3>
                  <p>
                    SKU {part.sku}
                    {part.reference ? ` · Ref ${part.reference}` : ""} · Seller{" "}
                    {part.seller || "unknown"}
                  </p>
                  <dl className="insights-facts">
                    <div>
                      <dt>Ordered item value</dt>
                      <dd>{orderMoney(part.amount, part.currency)}</dd>
                    </div>
                    <div>
                      <dt>Last purchase</dt>
                      <dd>
                        {part.lastDate.slice(0, 10)} · {part.lastQuantity} units
                      </dd>
                    </div>
                    <div>
                      <dt>Average observed interval</dt>
                      <dd>
                        {part.averageIntervalDays
                          ? `${part.averageIntervalDays} days`
                          : "At least 3 distinct purchase dates needed"}
                      </dd>
                    </div>
                  </dl>
                  {part.averageIntervalDays && (
                    <p className="insights-callout">
                      This part has a recurring purchasing pattern. Consider a
                      replenishment list; order frequency does not establish
                      current stock, consumption or a replacement date.
                    </p>
                  )}
                  <details>
                    <summary>Source orders ({part.orderIds.length})</summary>
                    <ul>
                      {part.orderIds.map((id) => (
                        <li key={id}>
                          <Link href={`/orders/${encodeURIComponent(id)}`}>
                            {id}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                  <Link
                    className="button secondary"
                    href={`/parts?q=${encodeURIComponent(part.reference || part.sku)}`}
                  >
                    Explore in Find Parts
                  </Link>
                  <InsightProduct
                    key={`product-${part.key}`}
                    orderId={part.lastOrderId}
                    index={part.lastIndex}
                  />
                  <InsightOffers key={part.key} part={part} />
                </div>
              )}
            </div>
          </section>
          {report.pairs.length > 0 && (
            <section className="detail-panel insights-section">
              <p className="eyebrow">ORGANIZE REPEAT PURCHASES</p>
              <h2>Often ordered together</h2>
              <p>
                Observed co-purchases, not a technical compatibility
                recommendation.
              </p>
              {report.pairs.map((pair) => (
                <article
                  className="insights-callout"
                  key={pair.names.join("|")}
                >
                  <h3>{pair.names.join(" + ")}</h3>
                  <p>Together in {pair.orderIds.length} orders.</p>
                  <Link
                    href={`/orders/${encodeURIComponent(pair.orderIds[0])}`}
                  >
                    Open a source order to prepare a list
                  </Link>
                </article>
              ))}
            </section>
          )}
          <section
            id="discount-evidence"
            className="detail-panel insights-section"
          >
            <h2>Discount evidence</h2>
            <p>
              Benefit names explain attribution when VTEX supplies a matching
              identifier. No amount is assigned to an individual promotion
              without a reliable breakdown.
            </p>
            <div className="insights-table-scroll">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Recorded discount</th>
                    <th>Linked benefits</th>
                  </tr>
                </thead>
                <tbody>
                  {report.discounts.map((d) => (
                    <tr key={d.orderId}>
                      <td>
                        <Link href={`/orders/${encodeURIComponent(d.orderId)}`}>
                          {d.orderId}
                        </Link>
                        <small>{d.date.slice(0, 10)}</small>
                      </td>
                      <td>
                        {d.amount === null
                          ? "Not provided"
                          : orderMoney(d.amount, d.currency)}
                      </td>
                      <td>
                        {d.benefits.join(", ") ||
                          "No named attribution provided"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
