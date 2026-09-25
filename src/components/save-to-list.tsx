"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import type { DraftLine } from "@/domain/order-draft";
export function SaveToList({
  lines,
  orderId,
}: {
  lines?: DraftLine[];
  orderId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<
    { id: string; name: string; status: string }[]
  >([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const lock = useRef(false);
  return (
    <section className="detail-panel">
      <h2>Save parts to a replenishment list</h2>
      {!open ? (
        <button
          className="button secondary"
          disabled={!orderId && !lines?.length}
          onClick={async () => {
            setOpen(true);
            setBusy(true);
            try {
              const response = await fetch("/api/portal/lists", {
                cache: "no-store",
              });
              const data = await response.json();
              if (!response.ok)
                throw new Error(data.error || "Lists unavailable.");
              setLists(
                data.filter((l: { status: string }) => l.status === "active"),
              );
            } catch (error) {
              setMessage(
                error instanceof Error ? error.message : "Lists unavailable.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Choose a list
        </button>
      ) : (
        <form
          className="draft-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (lock.current) return;
            lock.current = true;
            setBusy(true);
            setMessage("");
            try {
              const response = await fetch("/api/portal/populate-list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  listId: selected,
                  ...(orderId ? { orderId } : { lines }),
                }),
                signal: AbortSignal.timeout(110000),
              });
              const result = await response.json();
              if (!response.ok)
                throw new Error(
                  result.error || "Saving could not be confirmed.",
                );
              setMessage(
                result.complete
                  ? `${result.completed} SKU quantities saved and verified.`
                  : `${result.completed} of ${result.total} SKU updates confirmed. ${result.message}`,
              );
            } catch (error) {
              setMessage(
                `${error instanceof Error ? error.message : "Saving could not be confirmed."} Review your list before submitting again.`,
              );
            } finally {
              setBusy(false);
              setDone(true);
            }
          }}
        >
          <p>
            Quantities are added to the selected list. Existing quantities are
            increased. No order is placed.
          </p>
          <label>
            List
            <select
              required
              value={selected}
              disabled={busy || done}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Choose a list</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          {!busy && !lists.length && (
            <p>Create a list first, then return here.</p>
          )}
          <button
            className="button primary"
            disabled={busy || done || !selected}
          >
            {busy ? "Working…" : "Add parts to list"}
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
      <Link href="/lists">View or create lists</Link>
      {done && selected && (
        <p>
          <Link href={`/quick-order?list=${encodeURIComponent(selected)}`}>
            Review saved list contents
          </Link>
        </p>
      )}
    </section>
  );
}
