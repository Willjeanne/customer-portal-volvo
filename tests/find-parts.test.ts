/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « find parts », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-FLOTTE.md.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_PARTS_PAGE,
  clampPartsPage,
  exactReferenceMatch,
  isTruncated,
  parseSelectedFacets,
  partsPageSchema,
  reachablePages,
  readFacetGroups,
  selectedFacetPath,
  facetsSchema,
  withVehicleModel,
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

// >>> CLAUDE — lot fiabilisation, 20/09/2026 — à relire
// Non-régressions des points 3 à 6 de docs/REVUE-FLOTTE-PARTS.md.

test("point 3 — un véhicule impose son modèle sans effacer les autres facettes", () => {
  const url = [
    { key: "category-2", value: "brakes" },
    { key: "part-type", value: "genuine" },
  ];
  const merged = withVehicleModel("fh13-classic", url);
  assert.deepEqual(merged, [
    { key: "application", value: "fh13-classic" },
    { key: "category-2", value: "brakes" },
    { key: "part-type", value: "genuine" },
  ]);
  // Le chemin de requête porte bien Application ET le système.
  const path = selectedFacetPath(merged);
  assert.ok(path.includes("/application/fh13-classic"));
  assert.ok(path.includes("/category-2/brakes"));
  // Un modèle venu de l'URL ne peut pas contredire le véhicule reconnu.
  assert.deepEqual(
    withVehicleModel("vm", [{ key: "application", value: "fh-new" }]),
    [{ key: "application", value: "vm" }],
  );
});

test("point 4 — la pagination ne dépasse jamais la limite du moteur", () => {
  // Mesuré le 20/09 : Intelligent Search s'arrête à la page 50, quel que soit count.
  assert.equal(MAX_PARTS_PAGE, 50);
  assert.equal(partsPageSchema.safeParse(50).success, true);
  assert.equal(partsPageSchema.safeParse(51).success, false);
  // 1 764 produits à 12 par page feraient 147 pages : on n'en annonce que 50.
  assert.equal(Math.ceil(1764 / 12), 147);
  assert.equal(reachablePages(1764, 12), 50);
  assert.equal(isTruncated(1764, 12), true);
  // Un résultat court n'est pas tronqué et garde son vrai nombre de pages.
  assert.equal(reachablePages(25, 12), 3);
  assert.equal(isTruncated(25, 12), false);
  assert.equal(reachablePages(0, 12), 1);
  // Une page saisie à la main est ramenée dans la plage servie, sans erreur.
  assert.equal(clampPartsPage(999), 50);
  assert.equal(clampPartsPage(0), 1);
  assert.equal(clampPartsPage(-3), 1);
  assert.equal(clampPartsPage(40, 25, 12), 3);
});

test("point 6 — la référence exacte est reconnue par comparaison, pas par position", () => {
  const part = (reference: string) => ({
    productId: reference,
    reference,
    name: `Part ${reference}`,
    imageUrl: null,
    price: 1,
    listPrice: 1,
    available: 1,
  });
  // Cas réel mesuré : « 1521910 » rend aussi « 1521910k ».
  const results = [part("1521910k"), part("1521910"), part("1521910k-DD")];
  const found = exactReferenceMatch(results, "1521910");
  assert.equal(found?.reference, "1521910");
  // La position ne joue aucun rôle : l'exacte est ici en deuxième.
  assert.notEqual(results[0].reference, "1521910");
  assert.equal(exactReferenceMatch(results, " 1521910 ")?.reference, "1521910");
  assert.equal(exactReferenceMatch(results, "1521910K")?.reference, "1521910k");
  // Aucune référence rendue ne correspond : rien n'est étiqueté.
  assert.equal(exactReferenceMatch(results, "clutch"), undefined);
  assert.equal(exactReferenceMatch(results, ""), undefined);
  assert.equal(exactReferenceMatch([], "1521910"), undefined);
});

test("point 5 — les écrans catalogue ne lisent plus la devise acheteur", async () => {
  const { readFile } = await import("node:fs/promises");
  for (const file of [
    "src/components/find-parts.tsx",
    "src/app/fleet/[vehicleId]/page.tsx",
  ]) {
    const raw = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    // Le texte JSX est reformaté par Prettier : on compare sur une seule ligne.
    const source = raw.replace(/\s+/g, " ");
    // L'offre affichée est publique : l'étiqueter avec la devise de session
    // supposerait une correspondance de politique commerciale non démontrée.
    assert.ok(
      !source.includes("getBuyerProfile"),
      `${file} ne doit plus lire la devise acheteur`,
    );
    assert.ok(
      source.includes(
        "confirmed by the price and availability check in Quick Order",
      ) || source.includes("confirm in Quick Order"),
      `${file} doit renvoyer la confirmation vers Quick Order`,
    );
  }
});
// <<< CLAUDE
