/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « flotte de démonstration », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-FLOTTE.md.
 *     Fixtures et compatibilité approximative assumées : démonstration.
 */
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { Icon } from "@/components/icons";
import { PartsPicker } from "@/components/parts-picker";
import {
  applicationLabel,
  formatActivityDate,
  formatMileage,
  statusModifier,
  vehicleById,
  vehiclePhoto,
} from "@/domain/fleet";
import { getBuyerProfile } from "@/server/account";
import { listVehicleSystems, searchVehicleParts } from "@/server/parts";
import { PortalError } from "@/server/security";
import { getSession } from "@/server/session";
import { validateVtexSession } from "@/server/vtex";

export const dynamic = "force-dynamic";

export default async function VehiclePage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<{ system?: string; page?: string }>;
}) {
  const { vehicleId } = await params;
  const vehicle = vehicleById(vehicleId);
  if (!vehicle) notFound();

  const session = await getSession();
  if (!session) redirect("/login");
  if (session.context.mode === "vtex") {
    try {
      await validateVtexSession(session.upstreamCookies || "");
    } catch {
      redirect("/login");
    }
  }

  const query = await searchParams;
  const system =
    typeof query.system === "string" &&
    /^[a-z0-9][a-z0-9-]{0,59}$/.test(query.system)
      ? query.system
      : undefined;
  const page =
    typeof query.page === "string" && /^[1-9][0-9]?$/.test(query.page)
      ? Number(query.page)
      : 1;

  const [systems, results, currency] = await Promise.all([
    listVehicleSystems(vehicle.application)
      .then((data) => ({ data, error: null }))
      .catch((error: unknown) => ({ data: null, error })),
    searchVehicleParts(vehicle.application, system, page)
      .then((data) => ({ data, error: null }))
      .catch((error: unknown) => ({ data: null, error })),
    session.context.mode === "vtex"
      ? getBuyerProfile(session)
          .then((profile) => profile.currency ?? undefined)
          .catch(() => undefined)
      : Promise.resolve(undefined),
  ]);

  const pages = results.data
    ? Math.max(1, Math.ceil(results.data.total / results.data.pageSize))
    : 1;
  const pageLink = (value: number) => {
    const params = new URLSearchParams();
    if (system) params.set("system", system);
    if (value > 1) params.set("page", String(value));
    const search = params.toString();
    return `/fleet/${vehicle.id}${search ? `?${search}` : ""}#parts`;
  };

  return (
    <Shell context={session.context}>
      <Link href="/fleet" className="button secondary">
        Back to my fleet
      </Link>
      <p className="eyebrow">VEHICLE DETAIL</p>
      <h1>{vehicle.fleetNumber}</h1>

      <section className="detail-panel vehicle-summary">
        <div className="vehicle-summary-photo">
          <Image
            src={vehiclePhoto(vehicle)}
            alt={`${vehicle.modelLabel}, illustrative vehicle`}
            width={560}
            height={400}
            sizes="(max-width: 900px) 90vw, 360px"
            priority
          />
        </div>
        <div>
          <span className="tag">FIXTURE VEHICLE</span>
          <h2>{vehicle.modelLabel}</h2>
          {vehicle.alert && (
            <div className="fleet-alert-box">
              <Icon name="Warning" size={22} />
              <div>
                <h3>{vehicle.alert.title}</h3>
                <p>{vehicle.alert.detail}</p>
                <small>Detected {formatActivityDate(vehicle.alert.date)}</small>
              </div>
            </div>
          )}
          <dl>
            <dt>VIN</dt>
            <dd>{vehicle.vin}</dd>
            <dt>Registration</dt>
            <dd>{vehicle.registration}</dd>
            <dt>Mileage</dt>
            <dd>{formatMileage(vehicle.mileageKm)}</dd>
            <dt>Location</dt>
            <dd>{vehicle.site}</dd>
            <dt>Status</dt>
            <dd>
              <span className={`status-pill ${statusModifier(vehicle.status)}`}>
                {vehicle.status}
              </span>
            </dd>
            <dt>Active contract</dt>
            <dd>
              {vehicle.contract ? `${vehicle.contract} · Active` : "None"}
            </dd>
            <dt>Latest activity</dt>
            <dd>
              {vehicle.latestActivity.label} ·{" "}
              {formatActivityDate(vehicle.latestActivity.date)}
            </dd>
          </dl>
        </div>
      </section>

      <section className="detail-panel" id="parts">
        <span className="tag">VOLVOEMEA CATALOGUE</span>
        <h2>Compatible parts for {applicationLabel(vehicle)}</h2>
        {!systems.data ? (
          <p role="alert">
            {systems.error instanceof PortalError
              ? systems.error.message
              : "The parts catalogue could not be reached."}
          </p>
        ) : (
          <nav className="system-chips" aria-label="Part systems">
            <Link
              className={`system-chip ${system ? "" : "is-active"}`}
              href={`/fleet/${vehicle.id}#parts`}
            >
              All systems
            </Link>
            {systems.data.map((entry) => (
              <Link
                key={entry.slug}
                className={`system-chip ${system === entry.slug ? "is-active" : ""}`}
                href={`/fleet/${vehicle.id}?system=${encodeURIComponent(entry.slug)}#parts`}
              >
                {entry.label} <small>{entry.count}</small>
              </Link>
            ))}
          </nav>
        )}

        {!results.data ? (
          <p role="alert">
            {results.error instanceof PortalError
              ? results.error.message
              : "Parts could not be loaded. Please try again."}
          </p>
        ) : (
          <>
            <p>{results.data.total} parts listed for this vehicle</p>
            <PartsPicker parts={results.data.parts} currency={currency} />
            <nav className="order-pagination" aria-label="Part pages">
              {results.data.page > 1 && (
                <Link
                  className="button secondary"
                  href={pageLink(results.data.page - 1)}
                >
                  Previous
                </Link>
              )}
              <span>
                Page {results.data.page} of {pages}
              </span>
              {results.data.page < pages && (
                <Link
                  className="button secondary"
                  href={pageLink(results.data.page + 1)}
                >
                  Next
                </Link>
              )}
            </nav>
          </>
        )}
        <p className="form-note">
          Parts are listed from the catalogue `Application` specification.
          Prices, availability and cart are real.
        </p>
      </section>
    </Shell>
  );
}
