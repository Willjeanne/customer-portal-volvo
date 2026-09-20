/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « find parts », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-FLOTTE.md.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  parseSelectedFacets,
  readFacetGroups,
  selectedFacetPath,
  facetsSchema,
} from "../src/domain/parts";
import { isPresentableModel, modelFamily } from "../src/domain/volvo-models";
import { vehicleByIdentifier } from "../src/domain/fleet";
import { searchParts } from "../src/server/parts";

test("a fleet identifier resolves locally, and only on an exact match", () => {
  assert.equal(vehicleByIdentifier("YV2RT40AQFB312947")?.id, "truck-147");
  assert.equal(vehicleByIdentifier("yv2rt40aqfb312947")?.id, "truck-147");
  assert.equal(vehicleByIdentifier("Truck 118")?.application, "vm");
  assert.equal(vehicleByIdentifier("WG-4821-TX")?.id, "truck-147");
  // Une correspondance partielle détournerait une recherche texte légitime.
  assert.equal(vehicleByIdentifier("YV2RT40AQFB"), undefined);
  assert.equal(vehicleByIdentifier("Truck"), undefined);
  assert.equal(vehicleByIdentifier("brake"), undefined);
  assert.equal(vehicleByIdentifier(""), undefined);
});

test("facet selections survive the URL without letting anything else through", () => {
  assert.deepEqual(parseSelectedFacets("application:fh13-classic"), [
    { key: "application", value: "fh13-classic" },
  ]);
  assert.deepEqual(
    parseSelectedFacets(["application:vm", "category-2:brakes"]),
    [
      { key: "application", value: "vm" },
      { key: "category-2", value: "brakes" },
    ],
  );
  // Facette inconnue, valeur non conforme, doublon de clé, forme invalide.
  assert.deepEqual(parseSelectedFacets("category-1:trucks"), []);
  assert.deepEqual(parseSelectedFacets("application:../admin"), []);
  assert.deepEqual(parseSelectedFacets("application:Brakes"), []);
  assert.deepEqual(
    parseSelectedFacets(["application:vm", "application:fh-new"]),
    [{ key: "application", value: "vm" }],
  );
  assert.deepEqual(parseSelectedFacets(":oops"), []);
  assert.deepEqual(parseSelectedFacets(undefined), []);
});

test("the facet path is ordered and never pins category-1", () => {
  const path = selectedFacetPath([
    { key: "category-2", value: "brakes" },
    { key: "application", value: "vm" },
  ]);
  assert.equal(path, "/application/vm/category-2/brakes");
  assert.ok(!path.includes("category-1"));
  assert.equal(selectedFacetPath([]), "");
});

test("only usable facet groups reach the screen", () => {
  const groups = readFacetGroups(
    facetsSchema.parse({
      facets: [
        {
          key: "category-2",
          values: [
            { value: "brakes", name: "Brakes", quantity: 25 },
            { value: "cab", name: "Cab", quantity: 0 },
          ],
        },
        {
          key: "category-1",
          values: [{ value: "trucks", name: "Trucks", quantity: 99 }],
        },
        {
          key: "application-menu",
          values: [{ value: "rear", name: "Rear", quantity: 7 }],
        },
        { key: "price", values: [{ value: null, name: null, quantity: 30 }] },
        {
          key: "part-type",
          values: [{ value: "genuine", name: "Genuine", quantity: 58 }],
        },
      ],
    }),
  );
  assert.deepEqual(
    groups.map((group) => group.key),
    ["category-2", "part-type"],
  );
  assert.deepEqual(groups[0].values, [
    { value: "brakes", label: "Brakes", count: 25 },
  ]);
});

test("compound import labels stay out of the guided path", () => {
  for (const label of [
    "FH13 / FM11 / FM13",
    "FH13 \\ FM13",
    "FH 16, FH 420",
    "FM11 (D11C)",
    "",
  ])
    assert.equal(isPresentableModel(label), false, label);
  for (const label of ["FH13 Classic", "VM", "B12M", "NH12 Classic"])
    assert.equal(isPresentableModel(label), true, label);
  assert.equal(modelFamily("B12M"), "Buses");
  assert.equal(modelFamily("FH13 Classic"), "Trucks");
  assert.equal(modelFamily("VM"), "Trucks");
});

test("free search stays anonymous and asks for both products and facets", async (t) => {
  const seen: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    seen.push(url);
    assert.equal(new Headers(init.headers).get("Cookie"), null);
    return Response.json(
      url.includes("/facets/")
        ? { facets: [] }
        : { recordsFiltered: 0, products: [] },
      { status: 200 },
    );
  });

  const result = await searchParts({ query: "21811707", facets: [], page: 1 });
  assert.equal(result.total, 0);
  assert.equal(result.browsing, false);
  assert.equal(seen.length, 2);
  assert.ok(seen.some((url) => url.includes("/product_search/")));
  assert.ok(seen.some((url) => url.includes("/facets/")));
  // Une référence part en `query`, sans facette parasite.
  assert.ok(seen.every((url) => url.includes("query=21811707")));
  assert.ok(seen.every((url) => !url.includes("category-1")));

  seen.length = 0;
  const browsed = await searchParts({ query: "", facets: [], page: 1 });
  assert.equal(browsed.browsing, true);

  seen.length = 0;
  await searchParts({
    query: "",
    facets: [{ key: "application", value: "vm" }],
    page: 2,
  });
  assert.ok(seen[0].includes("/application/vm"));
  assert.ok(seen.some((url) => url.includes("page=2")));

  await assert.rejects(
    searchParts({
      query: "",
      facets: [{ key: "application", value: "../x" }],
      page: 1,
    }),
  );
});
