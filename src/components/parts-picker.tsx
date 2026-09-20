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
import { useRef, useState } from "react";
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
  const adding = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function addToDraft(part: Part) {
    if (adding.current) return;
    adding.current = true;
    setBusy(part.reference);
    setError("");
    setMessage("");
    try {
      const line = draftLineSchema.parse({
        sku: part.reference,
        quantity: Number(quantities[part.reference] || "1"),
      });
      const saved = await fetch("/api/portal/draft-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line }),
      });
      const result = await saved.json();
      if (!saved.ok)
        throw new Error(result.error || "The draft was not saved.");
      setMessage(
        `${result.added} × ${part.reference} added to your order preparation (${result.total} in total).`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "This part could not be added.",
      );
    } finally {
      adding.current = false;
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
            {/* >>> CLAUDE — lot fiabilisation, 20/09/2026 — textes d'offre uniquement,
                logique d'ajout inchangée. L'offre lue est publique : ni la devise
                acheteur ni une disponibilité contractuelle ne sont affirmées. */}
            <p className="part-price">
              {partMoney(part.price, currency)}
              <small>Catalogue price</small>
            </p>
            <p className="part-stock">
              {part.available > 0
                ? "Listed as available · confirm in Quick Order"
                : "Not listed as available"}
            </p>
            {/* <<< CLAUDE */}
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
                disabled={!!busy || part.available === 0}
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
