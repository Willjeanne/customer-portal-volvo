"use client";
import type { Preparation, CartResult } from "@/domain/cart";
import { useState } from "react";
import {
  draftCsv,
  draftLineSchema,
  parseOrderCsv,
  type DraftLine,
} from "@/domain/order-draft";
export function QuickOrder({
  initialLines = [],
  source = "Manual preparation",
}: {
  initialLines?: DraftLine[];
  source?: string;
}) {
  const [lines, updateLines] = useState(initialLines);
  const [checked, setChecked] = useState<Preparation | null>(null);
  const [transferred, setTransferred] = useState<CartResult | null>(null);
  function setLines(value: DraftLine[]) {
    updateLines(value);
    setChecked(null);
    setTransferred(null);
    setSaved("");
  }
  const [text, setText] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [errors, setErrors] = useState<string[]>([]);
  function importText(value: string) {
    const result = parseOrderCsv(value);
    setErrors(result.errors);
    if (!result.errors.length) setLines(result.lines);
  }
  function add() {
    const result = draftLineSchema.safeParse({
      sku,
      quantity: Number(quantity),
    });
    if (!result.success) {
      setErrors(["Enter a valid SKU and a whole quantity from 1 to 9999."]);
      return;
    }
    const imported = parseOrderCsv(draftCsv([...lines, result.data]));
    setErrors(imported.errors);
    if (!imported.errors.length) {
      setLines(imported.lines);
      setSku("");
      setQuantity("1");
    }
  }
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  async function savedDraft(load: boolean) {
    setBusy(true);
    setSaved("");
    setErrors([]);
    try {
      const response = await fetch(
        "/api/portal/draft",
        load
          ? { cache: "no-store" }
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lines }),
            },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Draft operation failed.");
      if (load) {
        const restored = draftLineSchema.array().max(200).parse(data.lines);
        setLines(restored);
      }
      setSaved(
        load ? "Saved draft restored." : "Draft saved for this portal session.",
      );
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "Draft operation failed.",
      ]);
    } finally {
      setBusy(false);
    }
  }
  async function cartAction(transfer: boolean) {
    setBusy(true);
    setErrors([]);
    setTransferred(null);
    try {
      const response = await fetch(
        `/api/portal/${transfer ? "transfer-cart" : "prepare-cart"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            transfer ? { preparationId: checked?.id } : { lines },
          ),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Cart operation failed.");
      if (transfer) {
        setTransferred(data);
        setChecked(null);
      } else setChecked(data);
    } catch (error) {
      setChecked(null);
      setErrors([
        error instanceof Error ? error.message : "Cart operation failed.",
      ]);
    } finally {
      setBusy(false);
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([draftCsv(lines)], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "volvo-order-draft.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <section className="detail-panel">
        <span className="tag">ORDER PREPARATION</span>
        <h2>Prepare your parts list</h2>
        <div className="order-pagination">
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => savedDraft(false)}
          >
            Save draft
          </button>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => savedDraft(true)}
          >
            Restore saved draft
          </button>
        </div>
        {saved && <p role="status">{saved}</p>}
        <p>
          {source}. Save this draft to keep it when navigating during this
          session, or export a CSV. Check prices and availability after
          preparing your list.
        </p>
        <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>
          <form
            className="draft-form"
            onSubmit={(event) => {
              event.preventDefault();
              add();
            }}
          >
            <label>
              SKU / reference
              <input
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                maxLength={80}
                required
              />
            </label>
            <label>
              Quantity
              <input
                type="number"
                min="1"
                max="9999"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </label>
            <button className="button primary">Add line</button>
          </form>
          <details>
            <summary>Paste or import CSV</summary>
            <p>
              Two columns: sku,quantity. Commas, semicolons and tabs are
              supported. Duplicate SKUs are combined. A successful import
              replaces the current draft.
            </p>
            <label>
              CSV content
              <textarea
                rows={5}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={"sku,quantity\n20374282,2"}
              />
            </label>
            <button
              className="button secondary"
              onClick={() => importText(text)}
            >
              Import pasted rows
            </button>
            <label>
              Choose CSV file
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 100_000) {
                    setErrors(["CSV must be smaller than 100 KB."]);
                    return;
                  }
                  try {
                    importText(await file.text());
                  } catch {
                    setErrors(["The file could not be read."]);
                  }
                  event.target.value = "";
                }}
              />
            </label>
          </details>
        </fieldset>
        {errors.length > 0 && (
          <div role="alert">
            <ul>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <section className="detail-panel">
        <h2>
          {lines.length} parts ·{" "}
          {lines.reduce((sum, line) => sum + line.quantity, 0)} units
        </h2>
        {lines.length === 0 ? (
          <p>Add a line or import a CSV to begin.</p>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>SKU / reference</th>
                    <th>Quantity</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.sku}>
                      <td>{line.sku}</td>
                      <td>{line.quantity}</td>
                      <td>
                        <button
                          className="button secondary"
                          disabled={busy}
                          aria-label={`Remove ${line.sku}`}
                          onClick={() =>
                            setLines(
                              lines.filter((item) => item.sku !== line.sku),
                            )
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="button primary" onClick={download}>
              Export draft CSV
            </button>
          </>
        )}
        <button
          className="button primary"
          disabled={busy || !lines.length}
          onClick={() => cartAction(false)}
        >
          {busy ? "Working…" : "Check prices & availability"}
        </button>
        <p className="form-note">
          Saved drafts expire on sign-out, session expiry, server restart or
          location change. Validation does not place an order. Availability is
          indicative until delivery and checkout are confirmed.
        </p>
      </section>
      {checked && (
        <section className="detail-panel">
          <h2>Price & availability check</h2>
          <p>
            Valid for five minutes. Quantities below are those accepted by the
            simulation, not total warehouse stock.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Part / SKU</th>
                  <th>Seller</th>
                  <th>Requested</th>
                  <th>Available</th>
                  <th>Unit price</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {checked.lines.map((line, index) => (
                  <tr key={index}>
                    <td>
                      {line.name}
                      <br />
                      {line.reference} → {line.sku || "—"}
                    </td>
                    <td>{line.seller || "—"}</td>
                    <td>{line.requested}</td>
                    <td>{line.available}</td>
                    <td>
                      {line.price === null
                        ? "—"
                        : new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: checked.currency,
                          }).format(line.price / 100)}
                    </td>
                    <td>{line.issue || "Available"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {checked.transferBlock && (
            <p role="status">{checked.transferBlock}</p>
          )}
          <button
            className="button primary"
            disabled={busy || !checked.canTransfer}
            onClick={() => cartAction(true)}
          >
            Transfer to cart
          </button>
        </section>
      )}
      {transferred && (
        <section className="detail-panel" role="status">
          <h2>
            {transferred.complete
              ? "Parts transferred to cart"
              : "Review the cart adjustments"}
          </h2>
          <p>No order has been placed.</p>
          <table className="orders-table">
            <thead>
              <tr>
                <th>SKU / seller</th>
                <th>Requested</th>
                <th>Added</th>
                <th>In cart</th>
              </tr>
            </thead>
            <tbody>
              {transferred.lines.map((line) => (
                <tr key={`${line.sku}/${line.seller}`}>
                  <td>
                    {line.sku} / {line.seller}
                  </td>
                  <td>{line.requested}</td>
                  <td>{line.added}</td>
                  <td>{line.inCart}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
