/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « find parts », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-FLOTTE.md.
 *
 * Composant serveur piloté par l'URL, comme la fiche véhicule : aucun endpoint
 * d'API supplémentaire, aucun état client. Les facettes sont des liens.
 */
import Link from "next/link";
import { getBuyerProfile } from "@/server/account";
import { searchParts } from "@/server/parts";
import { PortalError } from "@/server/security";
import type { PortalSession } from "@/server/session-store";
import { vehicleByIdentifier } from "@/domain/fleet";
import type { SelectedFacet } from "@/domain/parts";
import { isPresentableModel, modelFamily } from "@/domain/volvo-models";
import { Icon } from "./icons";
import { PartsPicker } from "./parts-picker";

function sameFacet(a: SelectedFacet, key: string, value: string) {
  return a.key === key && a.value === value;
}

export async function FindParts({
  session,
  query,
  facets,
  page,
}: {
  session: PortalSession;
  query: string;
  facets: SelectedFacet[];
  page: number;
}) {
  // Un VIN, un numéro de flotte ou une immatriculation bascule sur le modèle du
  // camion plutôt que d'être envoyé tel quel au moteur de recherche.
  const matched = vehicleByIdentifier(query);
  const activeFacets: SelectedFacet[] = matched
    ? [{ key: "application", value: matched.application }]
    : facets;
  const activeQuery = matched ? "" : query;

  const [result, currency] = await Promise.all([
    searchParts({ query: activeQuery, facets: activeFacets, page })
      .then((data) => ({ data, error: null }))
      .catch((error: unknown) => ({ data: null, error })),
    session.context.mode === "vtex"
      ? getBuyerProfile(session)
          .then((profile) => profile.currency ?? undefined)
          .catch(() => undefined)
      : Promise.resolve(undefined),
  ]);

  function link(next: SelectedFacet[], nextPage = 1) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    for (const facet of next) params.append("f", `${facet.key}:${facet.value}`);
    if (nextPage > 1) params.set("page", String(nextPage));
    const search = params.toString();
    return `/parts${search ? `?${search}` : ""}`;
  }

  function toggle(key: string, value: string) {
    const isActive = activeFacets.some((facet) => sameFacet(facet, key, value));
    // Une facette est mono-valeur : choisir une autre valeur remplace la première.
    const next = isActive
      ? activeFacets.filter((facet) => !sameFacet(facet, key, value))
      : [...activeFacets.filter((facet) => facet.key !== key), { key, value }];
    return link(next);
  }

  const pages = result.data
    ? Math.max(1, Math.ceil(result.data.total / result.data.pageSize))
    : 1;

  return (
    <>
      <section className="detail-panel">
        <h2>Find the right part</h2>
        <form className="parts-search" action="/parts">
          <label>
            <Icon name="MagnifyingGlass" size={20} />
            <span className="visually-hidden">
              Search by part number, VIN, fleet number or description
            </span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              maxLength={120}
              placeholder="Part number, VIN, fleet number or description"
            />
          </label>
          <button className="button primary">Search</button>
          {(query || facets.length > 0) && (
            <Link className="button secondary" href="/parts">
              Clear
            </Link>
          )}
        </form>

        {matched ? (
          <p className="parts-matched">
            <Icon name="Truck" size={18} />
            Matched <strong>{matched.fleetNumber}</strong> in your fleet —
            showing parts listed for {matched.modelLabel}.{" "}
            <Link href={`/fleet/${matched.id}`}>Open the vehicle</Link>
          </p>
        ) : (
          <p className="form-note">
            Enter a part number for an exact match, a VIN or fleet number from
            your fleet, or describe what you need. Fleet identifiers are matched
            against your demonstration fleet, not a Volvo vehicle service.
          </p>
        )}
      </section>

      {!result.data ? (
        <section className="detail-panel" role="alert">
          <h2>Parts unavailable</h2>
          <p>
            {result.error instanceof PortalError
              ? result.error.message
              : "The parts catalogue could not be reached. Please try again."}
          </p>
        </section>
      ) : (
        <section className="detail-panel">
          <span className="tag">VOLVOEMEA CATALOGUE</span>
          <h2>
            {result.data.browsing
              ? `Browse ${result.data.total} parts`
              : `${result.data.total} parts found`}
          </h2>

          {activeFacets.length > 0 && !matched && (
            <p className="active-facets">
              {activeFacets.map((facet) => (
                <Link
                  key={`${facet.key}:${facet.value}`}
                  className="active-facet"
                  href={toggle(facet.key, facet.value)}
                >
                  {facet.value} <Icon name="X" size={14} />
                </Link>
              ))}
            </p>
          )}

          {result.data.facets.map((group) => {
            const values =
              group.key === "application"
                ? group.values.filter((entry) =>
                    isPresentableModel(entry.label),
                  )
                : group.values;
            if (!values.length) return null;
            return (
              <div key={group.key} className="facet-group">
                <h3>
                  {group.label}
                  {group.key === "application" && (
                    <small>
                      {" "}
                      ·{" "}
                      {
                        new Set(values.map((entry) => modelFamily(entry.label)))
                          .size
                      }{" "}
                      vehicle {values.length > 1 ? "families" : "family"}
                    </small>
                  )}
                </h3>
                <nav className="system-chips" aria-label={group.label}>
                  {values.slice(0, 14).map((entry) => {
                    const isActive = activeFacets.some((facet) =>
                      sameFacet(facet, group.key, entry.value),
                    );
                    return (
                      <Link
                        key={entry.value}
                        className={`system-chip ${isActive ? "is-active" : ""}`}
                        href={toggle(group.key, entry.value)}
                      >
                        {entry.label} <small>{entry.count}</small>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}

          <PartsPicker parts={result.data.parts} currency={currency} />

          <nav className="order-pagination" aria-label="Part pages">
            {result.data.page > 1 && (
              <Link
                className="button secondary"
                href={link(activeFacets, result.data.page - 1)}
              >
                Previous
              </Link>
            )}
            <span>
              Page {result.data.page} of {pages}
            </span>
            {result.data.page < pages && (
              <Link
                className="button secondary"
                href={link(activeFacets, result.data.page + 1)}
              >
                Next
              </Link>
            )}
          </nav>

          <p className="form-note">
            Parts are listed from the catalogue `Application` specification.
            Prices, availability and cart are real. Some catalogue entries carry
            combined model labels and are reachable by text search only.
          </p>
        </section>
      )}
    </>
  );
}
