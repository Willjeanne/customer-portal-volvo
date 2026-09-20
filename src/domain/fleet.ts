/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « flotte de démonstration », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-FLOTTE.md.
 *     Fixtures et compatibilité approximative assumées : démonstration.
 *
 * Flotte entièrement fictive. Elle n'est lue par aucun système Volvo et n'est
 * écrite nulle part : c'est un jeu de démonstration, versionné avec le code.
 *
 * Le seul champ qui touche des données réelles est `application` : c'est un slug
 * de la facette Intelligent Search du catalogue volvoemea, typé par
 * `TruckApplication`, donc un modèle inexistant ne compile pas.
 */
import { z } from "zod";
import type { TruckApplication } from "./parts";
import { truckApplications } from "./parts";

export type VehicleStatus = "Normal" | "Maintenance Due" | "Vehicle Off Road";

export type CabFamily =
  | "fh-classic"
  | "fh-new"
  | "fm-classic"
  | "fm-new"
  | "vm"
  | "nh12";

export interface Vehicle {
  id: string;
  fleetNumber: string;
  modelLabel: string;
  application: TruckApplication;
  cabFamily: CabFamily;
  vin: string;
  registration: string;
  mileageKm: number;
  site: string;
  status: VehicleStatus;
  contract: string | null;
  latestActivity: { label: string; date: string };
  alert: { title: string; detail: string; date: string } | null;
}

/**
 * Les sites sont un attribut du véhicule, pas l'unité d'organisation VTEX.
 * En session réelle l'acheteur n'a qu'une unité : un filtre fondé dessus
 * n'aurait qu'une valeur. `context.unit` reste la portée d'autorisation.
 */
export const fleetSites = [
  "Dallas Workshop",
  "Houston DC",
  "Austin Workshop",
  "San Antonio Workshop",
] as const;

/**
 * Photos par gamme de cabine, pas une par véhicule.
 *
 * Visuels produit officiels d'AB Volvo, récupérés le 20/09/2026 sur
 * assets.volvo.com. Trois fichiers seulement : Volvo ne publie de vue studio
 * que pour les modèles au catalogue. Les générations Classic et le NH12
 * reprennent la vue de leur gamme actuelle — écart de génération, pas de
 * marque. Détail et provenance : public/assets/fleet/SOURCES.md.
 */
export const cabFamilies: Record<
  CabFamily,
  { label: string; photo: string | null }
> = {
  "fh-classic": {
    label: "Volvo FH Classic",
    photo: "/assets/fleet/volvo-fh.webp",
  },
  "fh-new": { label: "Volvo FH", photo: "/assets/fleet/volvo-fh.webp" },
  "fm-classic": {
    label: "Volvo FM Classic",
    photo: "/assets/fleet/volvo-fm.webp",
  },
  "fm-new": { label: "Volvo FM", photo: "/assets/fleet/volvo-fm.webp" },
  vm: { label: "Volvo VM", photo: "/assets/fleet/volvo-vm.webp" },
  nh12: { label: "Volvo NH12", photo: "/assets/fleet/volvo-fh.webp" },
};

const PHOTO_FALLBACK = "/assets/volvo-truck.png";

export function vehiclePhoto(vehicle: Vehicle): string {
  return cabFamilies[vehicle.cabFamily].photo ?? PHOTO_FALLBACK;
}

/**
 * VIN synthétiques. WMI européen `YV2`, mais la position 9 porte un `Q`, lettre
 * interdite dans un VIN réel : aucun de ces numéros ne peut désigner un véhicule
 * existant. Ils ne servent qu'à l'affichage et à la recherche locale.
 */
export const fleet: readonly Vehicle[] = [
  {
    id: "truck-147",
    fleetNumber: "Truck 147",
    modelLabel: "Volvo FH13 Classic",
    application: "fh13-classic",
    cabFamily: "fh-classic",
    vin: "YV2RT40AQFB312947",
    registration: "WG-4821-TX",
    mileageKm: 842631,
    site: "Dallas Workshop",
    status: "Vehicle Off Road",
    contract: "Parts Assure",
    latestActivity: { label: "Brake wear detected", date: "2026-09-17" },
    alert: {
      title: "Brake wear detected",
      detail: "Intervention recommended within 2,000 km.",
      date: "2026-09-17",
    },
  },
  {
    id: "truck-203",
    fleetNumber: "Truck 203",
    modelLabel: "Volvo FM13 New",
    application: "fm13-new",
    cabFamily: "fm-new",
    vin: "YV2RT40AQFB315521",
    registration: "WG-5519-TX",
    mileageKm: 615422,
    site: "Dallas Workshop",
    status: "Maintenance Due",
    contract: "Parts Assure",
    latestActivity: { label: "Service due in 4,000 km", date: "2026-09-14" },
    alert: null,
  },
  {
    id: "truck-332",
    fleetNumber: "Truck 332",
    modelLabel: "Volvo FM12 Classic",
    application: "fm12-classic",
    cabFamily: "fm-classic",
    vin: "YV2RT40AQFB324418",
    registration: "WG-3307-TX",
    mileageKm: 412903,
    site: "Dallas Workshop",
    status: "Normal",
    contract: "Parts Assure",
    latestActivity: { label: "Inspection completed", date: "2026-09-09" },
    alert: null,
  },
  {
    id: "truck-118",
    fleetNumber: "Truck 118",
    modelLabel: "Volvo VM",
    application: "vm",
    cabFamily: "vm",
    vin: "YV2RT40AQFB339932",
    registration: "WG-1184-TX",
    mileageKm: 298114,
    site: "Dallas Workshop",
    status: "Normal",
    contract: "Gold Contract",
    latestActivity: { label: "Routine check completed", date: "2026-09-12" },
    alert: null,
  },
  {
    id: "truck-410",
    fleetNumber: "Truck 410",
    modelLabel: "Volvo FH12 Classic",
    application: "fh12-classic",
    cabFamily: "fh-classic",
    vin: "YV2RT40AQFB346673",
    registration: "WG-4102-TX",
    mileageKm: 711552,
    site: "Dallas Workshop",
    status: "Normal",
    contract: "Parts Assure",
    latestActivity: { label: "Service completed", date: "2026-09-05" },
    alert: null,
  },
  {
    id: "truck-276",
    fleetNumber: "Truck 276",
    modelLabel: "Volvo FH13 New",
    application: "fh13-new",
    cabFamily: "fh-new",
    vin: "YV2RT40AQFB357720",
    registration: "WG-2761-TX",
    mileageKm: 521336,
    site: "Houston DC",
    status: "Maintenance Due",
    contract: "Parts Assure",
    latestActivity: { label: "Oil change due", date: "2026-09-10" },
    alert: null,
  },
  {
    id: "truck-087",
    fleetNumber: "Truck 087",
    modelLabel: "Volvo NH12 Classic",
    application: "nh12-classic",
    cabFamily: "nh12",
    vin: "YV2RT40AQFB361284",
    registration: "WG-0873-TX",
    mileageKm: 366287,
    site: "Houston DC",
    status: "Normal",
    contract: null,
    latestActivity: { label: "No recent activity", date: "2026-09-08" },
    alert: null,
  },
  {
    id: "truck-521",
    fleetNumber: "Truck 521",
    modelLabel: "Volvo FM11 Classic",
    application: "fm11-classic",
    cabFamily: "fm-classic",
    vin: "YV2RT40AQFB378046",
    registration: "WG-5210-TX",
    mileageKm: 489215,
    site: "Houston DC",
    status: "Normal",
    contract: "Gold Contract",
    latestActivity: { label: "Inspection completed", date: "2026-09-04" },
    alert: null,
  },
  {
    id: "truck-634",
    fleetNumber: "Truck 634",
    modelLabel: "Volvo VM",
    application: "vm",
    cabFamily: "vm",
    vin: "YV2RT40AQFB384159",
    registration: "WG-6347-TX",
    mileageKm: 203488,
    site: "Houston DC",
    status: "Normal",
    contract: "Parts Assure",
    latestActivity: { label: "Service completed", date: "2026-09-02" },
    alert: null,
  },
  {
    id: "truck-189",
    fleetNumber: "Truck 189",
    modelLabel: "Volvo FM13 Classic",
    application: "fm13-classic",
    cabFamily: "fm-classic",
    vin: "YV2RT40AQFB393346",
    registration: "WG-1893-TX",
    mileageKm: 583120,
    site: "Austin Workshop",
    status: "Maintenance Due",
    contract: "Gold Contract",
    latestActivity: { label: "Brake inspection due", date: "2026-09-02" },
    alert: null,
  },
  {
    id: "truck-245",
    fleetNumber: "Truck 245",
    modelLabel: "Volvo FH13 Classic",
    application: "fh13-classic",
    cabFamily: "fh-classic",
    vin: "YV2RT40AQFB402517",
    registration: "WG-2458-TX",
    mileageKm: 674905,
    site: "Austin Workshop",
    status: "Normal",
    contract: "Parts Assure",
    latestActivity: { label: "Routine check completed", date: "2026-08-31" },
    alert: null,
  },
  {
    id: "truck-307",
    fleetNumber: "Truck 307",
    modelLabel: "Volvo FM11 New",
    application: "fm11-new",
    cabFamily: "fm-new",
    vin: "YV2RT40AQFB416630",
    registration: "WG-3072-TX",
    mileageKm: 158742,
    site: "Austin Workshop",
    status: "Normal",
    contract: "Parts Assure",
    latestActivity: { label: "Service completed", date: "2026-08-28" },
    alert: null,
  },
  {
    id: "truck-452",
    fleetNumber: "Truck 452",
    modelLabel: "Volvo FH New",
    application: "fh-new",
    cabFamily: "fh-new",
    vin: "YV2RT40AQFB427188",
    registration: "WG-4526-TX",
    mileageKm: 96430,
    site: "Austin Workshop",
    status: "Normal",
    contract: null,
    latestActivity: { label: "No recent activity", date: "2026-08-25" },
    alert: null,
  },
  {
    id: "truck-163",
    fleetNumber: "Truck 163",
    modelLabel: "Volvo FM12 Classic",
    application: "fm12-classic",
    cabFamily: "fm-classic",
    vin: "YV2RT40AQFB438025",
    registration: "WG-1637-TX",
    mileageKm: 542190,
    site: "San Antonio Workshop",
    status: "Normal",
    contract: "Parts Assure",
    latestActivity: { label: "Inspection completed", date: "2026-08-24" },
    alert: null,
  },
  {
    id: "truck-298",
    fleetNumber: "Truck 298",
    modelLabel: "Volvo NH12 Classic",
    application: "nh12-classic",
    cabFamily: "nh12",
    vin: "YV2RT40AQFB449371",
    registration: "WG-2984-TX",
    mileageKm: 728044,
    site: "San Antonio Workshop",
    status: "Normal",
    contract: "Gold Contract",
    latestActivity: { label: "Service completed", date: "2026-08-21" },
    alert: null,
  },
  {
    id: "truck-375",
    fleetNumber: "Truck 375",
    modelLabel: "Volvo VM",
    application: "vm",
    cabFamily: "vm",
    vin: "YV2RT40AQFB456713",
    registration: "WG-3759-TX",
    mileageKm: 311867,
    site: "San Antonio Workshop",
    status: "Normal",
    contract: "Parts Assure",
    latestActivity: { label: "Routine check completed", date: "2026-08-19" },
    alert: null,
  },
];

export const defaultVehicleId = "truck-147";

// >>> CLAUDE — lot find parts, 20/09/2026 — à relire
/**
 * VIN, numéro de flotte ou immatriculation → véhicule. Recherche **locale** sur
 * la fixture : ce n'est pas un service VIN VTEX, et ça doit rester dit à l'écran.
 * Correspondance exacte seulement — une correspondance partielle détournerait une
 * recherche texte légitime.
 */
export function vehicleByIdentifier(term: string): Vehicle | undefined {
  const needle = term.trim().toLowerCase();
  if (needle.length < 3) return undefined;
  return fleet.find((vehicle) =>
    [vehicle.vin, vehicle.fleetNumber, vehicle.registration].some(
      (field) => field.toLowerCase() === needle,
    ),
  );
}
// <<< CLAUDE

export function vehicleById(id: string | undefined): Vehicle | undefined {
  return id ? fleet.find((vehicle) => vehicle.id === id) : undefined;
}

export function fleetCounts(vehicles: readonly Vehicle[] = fleet) {
  return {
    all: vehicles.length,
    needsAttention: vehicles.filter(
      (vehicle) => vehicle.status === "Maintenance Due",
    ).length,
    critical: vehicles.filter(
      (vehicle) => vehicle.status === "Vehicle Off Road",
    ).length,
  };
}

/** Modèles réellement présents dans la flotte, pour alimenter le filtre. */
export function fleetModels(vehicles: readonly Vehicle[] = fleet): string[] {
  return Array.from(
    new Set(vehicles.map((vehicle) => vehicle.modelLabel)),
  ).sort((a, b) => a.localeCompare(b));
}

export function fleetContracts(vehicles: readonly Vehicle[] = fleet): string[] {
  return Array.from(
    new Set(
      vehicles
        .map((vehicle) => vehicle.contract)
        .filter((contract): contract is string => contract !== null),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function applicationLabel(vehicle: Vehicle): string {
  return truckApplications[vehicle.application].label;
}

/** Classe d'état partagée par le tableau, le panneau et la fiche véhicule. */
export function statusModifier(status: VehicleStatus): string {
  if (status === "Vehicle Off Road") return "is-critical";
  if (status === "Maintenance Due") return "is-warning";
  return "is-normal";
}

export function formatMileage(km: number): string {
  return `${new Intl.NumberFormat("en-US").format(km)} km`;
}

export function formatActivityDate(value: string): string {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(date)
    : value;
}

/**
 * Le contexte ne retient que l'identifiant d'un véhicule connu, ou la chaîne
 * vide. Aucune saisie libre n'entre en session.
 */
export const vehicleSelection = z
  .string()
  .max(40)
  .refine(
    (value) => value === "" || fleet.some((vehicle) => vehicle.id === value),
    { message: "This vehicle is not part of the fleet." },
  );
