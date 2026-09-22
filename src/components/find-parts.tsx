import Form from "next/form";
/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « find parts », 20/09/2026.
 *     Fiabilisé le 20/09/2026 : points 3 à 6 de docs/REVUE-FLOTTE-PARTS.md.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-FLOTTE.md.
 *
 * Composant serveur piloté par l'URL, comme la fiche véhicule : aucun endpoint
 * d'API supplémentaire, aucun état client. Les facettes sont des liens.
 */
import Link from "next/link";
import { searchParts } from "@/server/parts";
import { PortalError } from "@/server/security";
import type { PortalSession } from "@/server/session-store";
import { vehicleByIdentifier } from "@/domain/fleet";
import {
  MAX_PARTS_PAGE,
  clampPartsPage,
  exactReferenceMatch,
  withVehicleModel,
  type SelectedFacet,
} from "@/domain/parts";
import { isPresentableModel, modelFamily } from "@/domain/volvo-models";
import { Icon } from "./icons";
import { PartsPicker } from "./parts-picker";

/** Nombre de facettes montrées d'emblée ; le reste passe derrière un dépliant. */
const FACETS_SHOWN = 14;

function sameFacet(a: SelectedFacet, key: string, value: string) {
  return a.key === key && a.value === value;
}

export async function FindParts({
  query,
  issue,
  facets,
  page,
}: {
  session: PortalSession;
  query: string;
  issue?: string;
  facets: SelectedFacet[];
  page: number;
}) {
  // Un VIN, un numéro de flotte ou une immatriculation impose le modèle du
  // camion. Les autres facettes de l'URL sont conservées : sans cela, choisir
  // un système après un VIN ne changeait pas la requête (revue, point 3).
  const matched = vehicleByIdentifier(query);
  const urlFacets = matched
    ? facets.filter((facet) => facet.key !== "application")
    : facets;
  const activeFacets = matched
    ? withVehicleModel(matched.application, urlFacets)
    : facets;
  const alertParts = issue === "alert" ? matched?.alert?.parts : undefined;
  const activeQuery = matched ? alertParts?.reference || "" : query;
  // L'appel lui-même est borné : le moteur refuse au-delà de la page 50 et sa
  // réponse sort alors du contrat (revue, point 4).
  const safePage = clampPartsPage(page);

  const result = await searchParts({
    query: activeQuery,
    facets: activeFacets,
    page: safePage,
  })
    .then((data) => ({ data, error: null }))
    .catch((error: unknown) => ({ data: null, error }));

  function link(next: SelectedFacet[], nextPage = 1, keepVehicle = true) {
    const params = new URLSearchParams();
    if (query && keepVehicle) params.set("q", query);
    if (alertParts && keepVehicle) params.set("issue", "alert");
    for (const facet of next) params.append("f", `${facet.key}:${facet.value}`);
    if (nextPage > 1) params.set("page", String(nextPage));
    const search = params.toString();
    return `/parts${search ? `?${search}` : ""}`;
  }

  function toggle(key: string, value: string) {
    const isActive = urlFacets.some((facet) => sameFacet(facet, key, value));
    // Une facette est mono-valeur : choisir une autre valeur remplace la première.
    const next = isActive
      ? urlFacets.filter((facet) => !sameFacet(facet, key, value))
      : [...urlFacets.filter((facet) => facet.key !== key), { key, value }];
    return link(next);
  }

  /** Retirer le véhicule conserve son modèle, sous forme de facette retirable. */
  const removeVehicleLink = matched
    ? link(
        [
          { key: "application", value: matched.application },
          ...urlFacets.filter((facet) => facet.key !== "application"),
        ],
        1,
        false,
      )
    : "/parts";

  const exact = result.data
    ? exactReferenceMatch(result.data.parts, activeQuery)
    : undefined;

  return (
    <>
      <section className="detail-panel">
        <h2>Find the right part</h2>
        <Form className="parts-search" action="/parts">
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
        </Form>

        {matched && alertParts && (
          <div className="detail-panel">
            <h2>
              Parts for {matched.fleetNumber} · {matched.alert?.title}
            </h2>
            <p>
              Suggested reference: <strong>{alertParts.reference}</strong>.
              Illustrative maintenance scenario; confirm fitment and diagnosis
              before replacement.
            </p>
            <Link
              className="button secondary"
              href={`/parts?${new URLSearchParams({ q: matched.vin })}`}
            >
              View all vehicle parts
            </Link>
          </div>
        )}
        {matched ? (
          <p className="parts-matched">
            <Icon name="Truck" size={18} />
            Matched <strong>{matched.fleetNumber}</strong> in your fleet —
            showing parts listed for {matched.modelLabel}.{" "}
            <Link href={`/fleet/${matched.id}`}>Open the vehicle</Link>
            <Link className="remove-vehicle" href={removeVehicleLink}>
              Remove vehicle <Icon name="X" size={14} />
            </Link>
          </p>
        ) : (
          <p className="form-note">
            Search matches part numbers and descriptions. A VIN, fleet number or
            registration is matched against your demonstration fleet, not a
            Volvo vehicle service.
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

          {/* La recherche est textuelle : on ne peut annoncer une correspondance
              exacte qu'après avoir comparé les références réellement rendues. */}
          {exact && (
            <p className="exact-match">
              <Icon name="CheckCircle" size={18} />
              Exact reference <strong>{exact.reference}</strong> found
              {result.data.total > 1
                ? ` — the other ${result.data.total - 1} results match the text of your search.`
                : "."}
            </p>
          )}

          {urlFacets.length > 0 && (
            <p className="active-facets">
              {urlFacets.map((facet) => (
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
            // Le modèle est imposé par le véhicule : son groupe réapparaît dès
            // que le véhicule est retiré, la facette restant alors retirable.
            if (matched && group.key === "application") return null;
            const values =
              group.key === "application"
                ? group.values.filter((entry) =>
                    isPresentableModel(entry.label),
                  )
                : group.values;
            if (!values.length) return null;
            const shown = values.slice(0, FACETS_SHOWN);
            const rest = values.slice(FACETS_SHOWN);
            const chip = (entry: (typeof values)[number]) => {
              const isActive = urlFacets.some((facet) =>
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
            };
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
                  {shown.map(chip)}
                </nav>
                {rest.length > 0 && (
                  <details className="facet-more">
                    <summary>Show {rest.length} more</summary>
                    <nav
                      className="system-chips"
                      aria-label={`${group.label}, remaining values`}
                    >
                      {rest.map(chip)}
                    </nav>
                  </details>
                )}
              </div>
            );
          })}

          <PartsPicker parts={result.data.parts} />

          {/* Une page saisie à la main peut dépasser la dernière page réelle :
              on le dit au lieu d'afficher un « Page 50 of 27 » incohérent. */}
          {result.data.page > result.data.pages ? (
            <nav className="order-pagination" aria-label="Part pages">
              <span>
                No results on page {result.data.page}. The last page is{" "}
                {result.data.pages}.
              </span>
              <Link
                className="button secondary"
                href={link(urlFacets, result.data.pages)}
              >
                Go to page {result.data.pages}
              </Link>
            </nav>
          ) : (
            <nav className="order-pagination" aria-label="Part pages">
              {result.data.page > 1 && (
                <Link
                  className="button secondary"
                  href={link(urlFacets, result.data.page - 1)}
                >
                  Previous
                </Link>
              )}
              <span>
                Page {result.data.page} of {result.data.pages}
              </span>
              {result.data.page < result.data.pages && (
                <Link
                  className="button secondary"
                  href={link(urlFacets, result.data.page + 1)}
                >
                  Next
                </Link>
              )}
            </nav>
          )}

          {result.data.truncated && (
            <p className="form-note">
              The catalogue search returns at most {MAX_PARTS_PAGE} pages.
              Narrow your search with a model, a system or a part number to
              reach the remaining results.
            </p>
          )}

          <p className="form-note">
            Catalogue price and availability, read from the public trade policy
            without your buyer session. Your contract price, your currency and
            the quantity actually available are confirmed by the price and
            availability check in Quick Order. Parts are listed from the
            catalogue `Application` specification, which is not a Volvo fitment
            source.
          </p>
        </section>
      )}
    </>
  );
}
