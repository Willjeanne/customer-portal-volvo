"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
export function CreateList() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");
  return (
    <div className="list-create">
      {!open && (
        <button
          className="button primary"
          onClick={() => {
            setOpen(true);
            setCreated("");
          }}
        >
          Create a list
        </button>
      )}
      {created && (
        <p role="status">
          List “{created}” created in VTEX. It is empty and ready for items.
        </p>
      )}
      {open && (
        <form
          className="draft-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (locked.current) return;
            locked.current = true;
            setBusy(true);
            setError("");
            const fields = new FormData(event.currentTarget);
            try {
              const response = await fetch("/api/portal/create-list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: fields.get("name"),
                  description: fields.get("description"),
                  cadenceType: fields.get("cadenceType"),
                }),
                signal: AbortSignal.timeout(20000),
              });
              const result = await response.json();
              if (!response.ok)
                throw new Error(
                  result.error ||
                    "Creation could not be confirmed. Reload your lists before trying again.",
                );
              setCreated(result.name);
              setOpen(false);
              locked.current = false;
              router.refresh();
            } catch (failure) {
              setError(
                (failure instanceof Error
                  ? failure.message
                  : "Creation could not be confirmed.") +
                  " Reload your lists before trying again to avoid a duplicate.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            List name
            <input name="name" maxLength={80} required disabled={busy} />
          </label>
          <label>
            Description
            <input name="description" maxLength={280} disabled={busy} />
          </label>
          <label>
            Replenishment frequency
            <select name="cadenceType" defaultValue="none" disabled={busy}>
              <option value="none">None</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every two weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <p>
            This creates an empty list. It does not place or schedule an order.
          </p>
          {error && <p role="alert">{error}</p>}
          <button className="button primary" disabled={busy || !!error}>
            {busy ? "Creating…" : "Create list"}
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={() => {
              setOpen(false);
              setError("");
              locked.current = false;
            }}
          >
            Close
          </button>
        </form>
      )}
    </div>
  );
}
