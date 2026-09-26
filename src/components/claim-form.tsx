"use client";
import Link from "next/link";
import { useState } from "react";
import type { z } from "zod";
import type { orderDetailSchema } from "@/domain/order";
import {
  claimReasons,
  validateClaimDraft,
  type claimDraftSchema,
  type SavedClaim,
} from "@/domain/claim";
export function ClaimForm({
  order,
  initial,
}: {
  initial?: SavedClaim;
  order: z.infer<typeof orderDetailSchema>;
}) {
  const [type, setType] = useState<"return" | "claim">(
    initial?.draft.type || "claim",
  );
  const [quantities, setQuantities] = useState<Record<number, string>>(
    Object.fromEntries(
      initial?.draft.lines.map((l) => [l.index, String(l.quantity)]) || [],
    ),
  );
  const [review, setReview] = useState<z.infer<typeof claimDraftSchema> | null>(
    null,
  );
  const [error, setError] = useState("");
  const [identity, setIdentity] = useState({
    id: initial?.id || "",
    revision: initial?.revision || 0,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  async function persist(action: "draft" | "submit") {
    if (!review || busy) return;
    const current = { ...identity, id: identity.id || crypto.randomUUID() };
    setIdentity(current);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/portal/save-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...current,
          orderId: order.orderId,
          action,
          draft: review,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || data.error || "Request could not be saved.",
        );
      setIdentity({ id: data.claim.id, revision: data.claim.revision });
      setSubmitted(action === "submit");
      setMessage(
        action === "submit"
          ? `Demo request recorded: ${data.claim.reference}`
          : "Draft saved. You can resume it from request history.",
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Request could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form
        className="claim-form detail-panel"
        hidden={!!review}
        onSubmit={(event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          const result = validateClaimDraft(
            {
              type,
              reason: fields.get("reason"),
              subject: fields.get("subject"),
              description: fields.get("description"),
              resolution: fields.get("resolution"),
              lines: Object.entries(quantities).map(([index, quantity]) => ({
                index: Number(index),
                quantity: Number(quantity),
              })),
            },
            order.items,
          );
          if (result.error) {
            setError(result.error);
            return;
          }
          setError("");
          setReview(result.data!);
        }}
      >
        <h2>1. Select parts</h2>
        <p>Select only the parts concerned by your request.</p>
        {order.items.map((item, index) => (
          <div className="claim-part" key={index}>
            <label className="claim-selection">
              <input
                type="checkbox"
                checked={index in quantities}
                onChange={(event) =>
                  setQuantities((old) => {
                    const updated = { ...old };
                    if (event.target.checked) updated[index] = "1";
                    else delete updated[index];
                    return updated;
                  })
                }
              />
              <span>
                <strong>{item.name}</strong>
                <br />
                SKU {item.id}
                {item.refId ? ` · Ref ${item.refId}` : ""} · Ordered:{" "}
                {item.quantity}
              </span>
            </label>
            {index in quantities && (
              <label>
                Quantity concerned
                <input
                  aria-label={`Quantity for ${item.name}, line ${index + 1}`}
                  type="number"
                  min={1}
                  max={item.quantity}
                  step={1}
                  required
                  value={quantities[index]}
                  onChange={(event) =>
                    setQuantities({
                      ...quantities,
                      [index]: event.target.value,
                    })
                  }
                />
              </label>
            )}
          </div>
        ))}
        <h2>2. Describe your request</h2>
        <div className="claim-fields">
          <label>
            Request type
            <select
              value={type}
              onChange={(event) => setType(event.target.value as typeof type)}
            >
              <option value="claim">Claim — report an issue</option>
              <option value="return">Return</option>
            </select>
          </label>
          <label>
            Reason
            <select
              name="reason"
              required
              key={type}
              defaultValue={
                initial?.draft.type === type ? initial.draft.reason : ""
              }
            >
              <option value="">Choose a reason</option>
              {claimReasons[type].map((reason) => (
                <option key={reason}>{reason}</option>
              ))}
            </select>
          </label>
          <label>
            Subject
            <input
              name="subject"
              defaultValue={initial?.draft.subject}
              required
              maxLength={120}
            />
          </label>
          <label>
            Expected resolution
            <select name="resolution" defaultValue={initial?.draft.resolution}>
              <option>Replacement</option>
              <option>Return instructions</option>
              <option>Refund review</option>
              <option>Assistance</option>
            </select>
          </label>
        </div>
        <label>
          Describe the issue
          <textarea
            name="description"
            defaultValue={initial?.draft.description}
            required
            minLength={10}
            maxLength={3000}
            rows={6}
            placeholder="What happened? Which parts are affected, and what would you like us to review?"
          />
        </label>
        <p>
          The requested resolution is subject to review. Return eligibility and
          warranty coverage have not been assessed.
        </p>
        {error && <p role="alert">{error}</p>}
        <button className="button primary" type="submit">
          Review request
        </button>
        <p className="form-note">
          Review your request to save a draft or record a demo request. No
          request is sent to Volvo.
        </p>
      </form>
      {review && (
        <section className="detail-panel claim-form" aria-live="polite">
          <h2>Review your request</h2>
          <p>Order {order.orderId}</p>
          <dl>
            <dt>Type / reason</dt>
            <dd>
              {review.type} · {review.reason}
            </dd>
            <dt>Subject</dt>
            <dd>{review.subject}</dd>
            <dt>Expected resolution</dt>
            <dd>{review.resolution}</dd>
          </dl>
          <ul>
            {review.lines.map((line) => (
              <li key={line.index}>
                {order.items[line.index].name} · SKU{" "}
                {order.items[line.index].id} · Quantity: {line.quantity}
              </li>
            ))}
          </ul>
          <p className="claim-description">{review.description}</p>
          <p>
            Demo only: no Volvo case, return authorization or refund is created.
          </p>
          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}
          {!submitted && (
            <div className="claim-actions">
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => persist("draft")}
              >
                Save draft
              </button>
              <button
                className="button primary"
                disabled={busy}
                onClick={() => persist("submit")}
              >
                {busy ? "Saving…" : "Submit demo request"}
              </button>
            </div>
          )}
          <Link href="/claims" prefetch={false}>
            View request history
          </Link>
          <button
            type="button"
            className="button secondary"
            disabled={busy || submitted}
            onClick={() => setReview(null)}
          >
            Back to edit
          </button>
        </section>
      )}
    </>
  );
}
