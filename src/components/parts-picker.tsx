/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « flotte de démonstration », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-FLOTTE.md.
 *     Fixtures et compatibilité approximative assumées : démonstration.
 *
 * L'ajout passe par le brouillon de session existant (/api/portal/draft), puis
 * par le parcours Quick Order déjà en place : résolution SKU, simulation prix et
 * stock, transfert vers l'orderForm. Aucun nouvel endpoint d'achat n'est créé.
 */
"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { draftLineSchema } from "@/domain/order-draft";
import { partMoney, type Part } from "@/domain/parts";
import { Icon } from "./icons";

export function PartsPicker({
  parts,
  currency,
}: {
  parts: Part[];
  currency?: string;
}) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function addToDraft(part: Part) {
    setBusy(part.reference);
    setError("");
    setMessage("");
    try {
      const line = draftLineSchema.parse({
        sku: part.reference,
        quantity: Number(quantities[part.reference] || "1"),
      });
      // Le brouillon est remplacé en entier par l'API : on relit avant d'écrire.
      const current = await fetch("/api/portal/draft", { cache: "no-store" });
      const existing = await current.json();
      if (!current.ok) throw new Error(existing.error || "Draft unavailable.");
      const lines = draftLineSchema
        .array()
        .max(200)
        .parse(existing.lines ?? []);
      const merged = [...lines];
      const found = merged.findIndex((entry) => entry.sku === line.sku);
      if (found >= 0)
        merged[found] = {
          sku: line.sku,
          quantity: Math.min(9999, merged[found].quantity + line.quantity),
        };
      else merged.push(line);

      const saved = await fetch("/api/portal/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: merged }),
      });
      const result = await saved.json();
      if (!saved.ok)
        throw new Error(result.error || "The draft was not saved.");
      setMessage(
        `${line.quantity} × ${part.reference} added to your order preparation.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "This part could not be added.",
      );
    } finally {
      setBusy("");
    }
  }

  if (parts.length === 0) return <p>No part is listed for this selection.</p>;

  return (
    <>
      {(message || error) && (
        <p role="status" className={error ? "picker-error" : "picker-status"}>
          {error || message}
          {!error && (
            <Link href="/quick-order"> Review your order preparation.</Link>
          )}
        </p>
      )}
      <ul className="parts-grid">
        {parts.map((part) => (
          <li key={part.reference} className="part-card">
            <div className="part-image">
              {part.imageUrl ? (
                <Image
                  src={part.imageUrl}
                  alt=""
                  width={220}
                  height={220}
                  sizes="(max-width: 700px) 45vw, 200px"
                />
              ) : (
                <Icon name="Package" size={40} />
              )}
            </div>
            <h3>{part.name}</h3>
            <p className="part-reference">Ref. {part.reference}</p>
            <p className="part-price">{partMoney(part.price, currency)}</p>
            <p className="part-stock">
              {part.available > 0 ? "In stock" : "Not available"}
            </p>
            <div className="part-actions">
              <label>
                <span className="visually-hidden">
                  Quantity for {part.reference}
                </span>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  step="1"
                  value={quantities[part.reference] ?? "1"}
                  onChange={(event) =>
                    setQuantities({
                      ...quantities,
                      [part.reference]: event.target.value,
                    })
                  }
                />
              </label>
              <button
                className="button primary"
                disabled={busy === part.reference || part.available === 0}
                onClick={() => addToDraft(part)}
              >
                {busy === part.reference ? "Adding…" : "Add"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
