/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « flotte de démonstration », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-FLOTTE.md.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  cabFamilies,
  fleet,
  fleetContracts,
  fleetCounts,
  fleetModels,
  fleetSites,
  vehicleById,
  vehiclePhoto,
  vehicleSelection,
} from "../src/domain/fleet";
import { truckApplications } from "../src/domain/parts";

test("fleet fixtures stay consistent and every model exists in the catalogue", () => {
  assert.equal(fleet.length, 16);
  for (const key of ["id", "fleetNumber", "vin", "registration"] as const) {
    const values = fleet.map((vehicle) => vehicle[key]);
    assert.equal(new Set(values).size, fleet.length, `${key} must be unique`);
  }
  for (const vehicle of fleet) {
    assert.ok(
      vehicle.application in truckApplications,
      `${vehicle.fleetNumber} points at an unknown application slug`,
    );
    assert.ok(
      vehicle.cabFamily in cabFamilies,
      `${vehicle.fleetNumber} points at an unknown cab family`,
    );
    assert.ok(
      (fleetSites as readonly string[]).includes(vehicle.site),
      `${vehicle.fleetNumber} points at an unknown site`,
    );
    assert.ok(vehicle.mileageKm > 0);
    assert.ok(vehiclePhoto(vehicle).startsWith("/assets/"));
  }
});

test("synthetic VINs cannot collide with a real vehicle", () => {
  for (const vehicle of fleet) {
    assert.equal(vehicle.vin.length, 17, `${vehicle.fleetNumber} VIN length`);
    assert.ok(vehicle.vin.startsWith("YV2"));
    // Position 9 est la clé de contrôle d'un VIN réel : `Q` y est interdit.
    assert.equal(
      vehicle.vin[8],
      "Q",
      `${vehicle.fleetNumber} must stay invalid`,
    );
  }
});

test("counters and filter sources are derived, never hardcoded", () => {
  const counts = fleetCounts();
  assert.deepEqual(counts, { all: 16, needsAttention: 3, critical: 1 });
  assert.equal(
    counts.critical,
    fleet.filter((vehicle) => vehicle.status === "Vehicle Off Road").length,
  );
  // Deux alertes illustrent les parcours freinage et filtration.
  const alerted = fleet.filter((vehicle) => vehicle.alert);
  assert.equal(alerted.length, 2);
  assert.equal(alerted[0].id, "truck-147");
  assert.ok(fleetModels().length > 1);
  assert.deepEqual(fleetContracts(), ["Gold Contract", "Parts Assure"]);
});

test("only a known vehicle identifier can enter the session context", () => {
  assert.equal(vehicleSelection.safeParse("").success, true);
  assert.equal(vehicleSelection.safeParse("truck-147").success, true);
  for (const value of ["Truck 147", "truck-999", "../admin", "x".repeat(60)])
    assert.equal(
      vehicleSelection.safeParse(value).success,
      false,
      `${value} must be rejected`,
    );
  assert.equal(vehicleById("truck-147")?.modelLabel, "Volvo FH13 Classic");
  assert.equal(vehicleById("truck-999"), undefined);
  assert.equal(vehicleById(undefined), undefined);
});
