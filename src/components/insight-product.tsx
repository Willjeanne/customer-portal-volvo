"use client";
import { useRef, useState } from "react";
export function InsightProduct({
  orderId,
  index,
}: {
  orderId: string;
  index: number;
}) {
  const [product, setProduct] = useState<{
    name: string;
    brand: string | null;
    categories: string[];
    applications: string[];
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function load() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/portal/insight-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, index }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Product details unavailable.");
      setProduct(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Product details unavailable.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="insights-callout">
      <h4>Know this part</h4>
      {product ? (
        <>
          <p>{product.name}</p>
          <p>Brand: {product.brand || "Not provided"}</p>
          <p>
            Catalogue families:{" "}
            {product.categories
              .map((c) => c.split("/").filter(Boolean).join(" › "))
              .join(" · ") || "Not provided"}
          </p>
          <p>
            Catalogue applications:{" "}
            {product.applications.join(", ") || "Not provided"}
          </p>
          <p className="form-note">
            Current catalogue data. Model application does not certify VIN
            compatibility or a repair recommendation.
          </p>
        </>
      ) : (
        <button className="button secondary" disabled={busy} onClick={load}>
          {busy ? "Loading…" : "Load product families & applications"}
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
