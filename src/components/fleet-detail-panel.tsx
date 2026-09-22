/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « flotte de démonstration », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-FLOTTE.md.
 *     Fixtures et compatibilité approximative assumées : démonstration.
 */
"use client";
import { vehicleAlertPartsLink } from "@/domain/fleet";
import Image from "next/image";
import Link from "next/link";
import {
  formatActivityDate,
  formatMileage,
  statusModifier,
  vehiclePhoto,
  type Vehicle,
} from "@/domain/fleet";
import { Icon } from "./icons";

export function FleetDetailPanel({
  vehicle,
  onClose,
}: {
  vehicle: Vehicle;
  onClose: () => void;
}) {
  return (
    <aside
      className="fleet-panel"
      aria-label={`${vehicle.fleetNumber} details`}
    >
      <button
        className="fleet-panel-close"
        onClick={onClose}
        aria-label="Close vehicle details"
      >
        <Icon name="X" size={20} />
      </button>
      <h2>{vehicle.fleetNumber}</h2>
      <p className="fleet-panel-identity">
        {vehicle.modelLabel} <span aria-hidden="true">|</span> VIN {vehicle.vin}
      </p>
      <div className="fleet-panel-photo">
        <Image
          src={vehiclePhoto(vehicle)}
          alt={`${vehicle.modelLabel}, illustrative vehicle`}
          width={560}
          height={400}
          sizes="(max-width: 900px) 90vw, 320px"
        />
      </div>
      {vehicle.alert && (
        <div className="fleet-alert-box">
          <Icon name="Warning" size={22} />
          <div>
            <h3>{vehicle.alert.title}</h3>
            <p>{vehicle.alert.detail}</p>
            <small>
              Detected {formatActivityDate(vehicle.alert.date)}
              <span aria-hidden="true"> | </span>
              {formatMileage(vehicle.mileageKm)}
            </small>
          </div>
        </div>
      )}
      <dl className="fleet-panel-facts">
        <div>
          <dt>
            <Icon name="MapPin" size={18} /> Location
          </dt>
          <dd>{vehicle.site}</dd>
        </div>
        <div>
          <dt>
            <Icon name="Warning" size={18} /> Status
          </dt>
          <dd>
            <span className={`status-pill ${statusModifier(vehicle.status)}`}>
              {vehicle.status}
            </span>
          </dd>
        </div>
        <div>
          <dt>
            <Icon name="ShieldCheck" size={18} /> Active contract
          </dt>
          <dd>
            {vehicle.contract ? (
              <>
                {vehicle.contract}
                <small className="contract-state">Active</small>
              </>
            ) : (
              "None"
            )}
          </dd>
        </div>
        <div>
          <dt>
            <Icon name="FileText" size={18} /> Latest activity
          </dt>
          <dd>
            {vehicle.latestActivity.label}
            <small>{formatActivityDate(vehicle.latestActivity.date)}</small>
          </dd>
        </div>
      </dl>
      <div className="fleet-panel-actions">
        <Link className="button primary" href={`/fleet/${vehicle.id}`}>
          View vehicle
          <Icon name="ArrowRight" size={18} />
        </Link>
        <Link
          className="button secondary"
          href={vehicleAlertPartsLink(vehicle)}
        >
          <Icon name="ShoppingCart" size={18} />
          Find suggested parts
        </Link>
        <Link className="button secondary" href="/orders">
          <Icon name="FileText" size={18} />
          View orders
        </Link>
      </div>
      <div className="dealer-card">
        <Icon name="Handshake" size={26} />
        <div>
          <small>Preferred dealer</small>
          <strong>Volvo Trucks Dallas</strong>
          <p>Your preferred dealer for parts and service.</p>
        </div>
        <Link href="/support">Contact</Link>
      </div>
    </aside>
  );
}
