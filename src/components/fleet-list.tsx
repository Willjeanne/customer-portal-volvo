/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « flotte de démonstration », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-FLOTTE.md.
 *     Fixtures et compatibilité approximative assumées : démonstration.
 *
 * Filtres, tri et pagination sont calculés sur les fixtures, côté client.
 * Aucun appel réseau : la flotte est locale.
 */
"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import {
  fleet,
  fleetContracts,
  fleetCounts,
  fleetModels,
  fleetSites,
  formatActivityDate,
  statusModifier,
  formatMileage,
  vehiclePhoto,
  type Vehicle,
} from "@/domain/fleet";
import { FleetDetailPanel } from "./fleet-detail-panel";
import { Icon } from "./icons";

const PAGE_SIZE = 8;
const statuses: Vehicle["status"][] = [
  "Normal",
  "Maintenance Due",
  "Vehicle Off Road",
];
const sorts = [
  "Alert status",
  "Fleet number",
  "Mileage",
  "Latest activity",
] as const;
type Sort = (typeof sorts)[number];
type Tab = "all" | "attention" | "critical";

const alertRank: Record<Vehicle["status"], number> = {
  "Vehicle Off Road": 0,
  "Maintenance Due": 1,
  Normal: 2,
};

function matchesSearch(vehicle: Vehicle, term: string): boolean {
  if (!term) return true;
  const needle = term.trim().toLowerCase();
  return [
    vehicle.fleetNumber,
    vehicle.vin,
    vehicle.registration,
    vehicle.modelLabel,
  ].some((field) => field.toLowerCase().includes(needle));
}

export function FleetList({ selected }: { selected?: string }) {
  const [search, setSearch] = useState("");
  const [site, setSite] = useState("");
  const [status, setStatus] = useState("");
  const [model, setModel] = useState("");
  const [contract, setContract] = useState("");
  const [sort, setSort] = useState<Sort>("Alert status");
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | undefined>(selected);

  const counts = fleetCounts();

  const filtered = useMemo(() => {
    const rows = fleet.filter(
      (vehicle) =>
        matchesSearch(vehicle, search) &&
        (!site || vehicle.site === site) &&
        (!status || vehicle.status === status) &&
        (!model || vehicle.modelLabel === model) &&
        (!contract || vehicle.contract === contract) &&
        (tab === "all" ||
          (tab === "attention" && vehicle.status === "Maintenance Due") ||
          (tab === "critical" && vehicle.status === "Vehicle Off Road")),
    );
    return [...rows].sort((a, b) => {
      if (sort === "Fleet number")
        return a.fleetNumber.localeCompare(b.fleetNumber);
      if (sort === "Mileage") return b.mileageKm - a.mileageKm;
      if (sort === "Latest activity")
        return b.latestActivity.date.localeCompare(a.latestActivity.date);
      return (
        alertRank[a.status] - alertRank[b.status] ||
        a.fleetNumber.localeCompare(b.fleetNumber)
      );
    });
  }, [search, site, status, model, contract, tab, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const open = filtered.find((vehicle) => vehicle.id === openId);

  function reset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div className="fleet-screen">
      <div className="fleet-main">
        <div className="fleet-heading">
          <div>
            <h1>My fleet</h1>
            <p className="lead">
              {counts.all} vehicles across {fleetSites.length} locations
            </p>
          </div>
          <label className="fleet-search">
            <Icon name="MagnifyingGlass" size={20} />
            <span className="visually-hidden">
              Search by VIN, fleet number, registration or model
            </span>
            <input
              type="search"
              value={search}
              placeholder="Search by VIN, fleet number, registration or model"
              onChange={(event) => reset(setSearch)(event.target.value)}
            />
          </label>
        </div>

        <div className="fleet-filters">
          <label>
            Location
            <select
              value={site}
              onChange={(event) => reset(setSite)(event.target.value)}
            >
              <option value="">All locations</option>
              {fleetSites.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(event) => reset(setStatus)(event.target.value)}
            >
              <option value="">All status</option>
              {statuses.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Model
            <select
              value={model}
              onChange={(event) => reset(setModel)(event.target.value)}
            >
              <option value="">All models</option>
              {fleetModels().map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Contract
            <select
              value={contract}
              onChange={(event) => reset(setContract)(event.target.value)}
            >
              <option value="">All contracts</option>
              {fleetContracts().map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Sort by
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
            >
              {sorts.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="fleet-tabs" role="tablist" aria-label="Fleet status">
          {(
            [
              ["all", `All ${counts.all}`, ""],
              [
                "attention",
                `Needs attention ${counts.needsAttention}`,
                "is-warning",
              ],
              ["critical", `Critical ${counts.critical}`, "is-critical"],
            ] as [Tab, string, string][]
          ).map(([value, label, modifier]) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              className={`fleet-tab ${modifier} ${tab === value ? "is-active" : ""}`}
              onClick={() => reset(setTab)(value)}
            >
              {modifier && <span className="tab-dot" aria-hidden="true" />}
              {label}
            </button>
          ))}
        </div>

        <div className="fleet-table-wrap">
          <table className="fleet-table">
            <thead>
              <tr>
                <th>Vehicle / VIN</th>
                <th>Location</th>
                <th>Mileage</th>
                <th>Status</th>
                <th>Active contract</th>
                <th>Latest activity</th>
                <th>
                  <span className="visually-hidden">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className={openId === vehicle.id ? "is-selected" : ""}
                >
                  <td>
                    <button
                      className="fleet-identity"
                      onClick={() => setOpenId(vehicle.id)}
                      aria-expanded={openId === vehicle.id}
                    >
                      <Image
                        src={vehiclePhoto(vehicle)}
                        alt=""
                        width={64}
                        height={46}
                        sizes="64px"
                      />
                      <span>
                        <strong>{vehicle.fleetNumber}</strong>
                        <span>{vehicle.modelLabel}</span>
                        <small>VIN {vehicle.vin}</small>
                      </span>
                    </button>
                  </td>
                  <td>{vehicle.site}</td>
                  <td>{formatMileage(vehicle.mileageKm)}</td>
                  <td>
                    <span
                      className={`status-pill ${statusModifier(vehicle.status)}`}
                    >
                      {vehicle.status}
                    </span>
                  </td>
                  <td>
                    {vehicle.contract ? (
                      <span className="contract-cell">
                        {vehicle.contract}
                        <small>Active</small>
                      </span>
                    ) : (
                      <span className="contract-cell is-empty">None</span>
                    )}
                  </td>
                  <td>
                    <span className="activity-cell">
                      {vehicle.latestActivity.label}
                      <small>
                        {formatActivityDate(vehicle.latestActivity.date)}
                      </small>
                    </span>
                  </td>
                  <td>
                    <button
                      className="row-open"
                      onClick={() => setOpenId(vehicle.id)}
                      aria-label={`Open ${vehicle.fleetNumber}`}
                    >
                      <Icon name="CaretRight" size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="fleet-empty">
              No vehicle matches these filters. Clear the search or pick another
              location.
            </p>
          )}
        </div>

        <nav className="fleet-pagination" aria-label="Fleet pages">
          <span>
            Showing {rows.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}–
            {(current - 1) * PAGE_SIZE + rows.length} of {filtered.length}{" "}
            vehicles
          </span>
          <div>
            <button
              className="button secondary"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </button>
            <span>
              Page {current} of {pages}
            </span>
            <button
              className="button secondary"
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
            >
              Next
            </button>
          </div>
        </nav>

        <p className="form-note">
          <span className="tag">FIXTURE FLEET</span> Vehicles, VIN and contracts
          are demonstration data. Parts, prices and availability come from the
          real volvoemea catalogue.
        </p>
      </div>

      {open && (
        <FleetDetailPanel vehicle={open} onClose={() => setOpenId(undefined)} />
      )}
    </div>
  );
}
