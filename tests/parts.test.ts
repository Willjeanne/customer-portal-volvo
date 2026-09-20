/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « flotte de démonstration », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-FLOTTE.md.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  applicationSchema,
  facetPath,
  facetsSchema,
  partMoney,
  partSearchSchema,
  readParts,
  readSystems,
  systemSchema,
} from "../src/domain/parts";
import { listVehicleSystems, searchVehicleParts } from "../src/server/parts";

test("facet paths never pin category-1 and reject unknown slugs", () => {
  assert.equal(facetPath("fh13-classic"), "/application/fh13-classic");
  assert.equal(
    facetPath("fh13-classic", "brakes"),
    "/application/fh13-classic/category-2/brakes",
  );
  // Épingler category-1 perd des produits : 175 en portent une qui contredit
  // leurs modèles. Le chemin ne doit donc jamais la contenir.
  assert.ok(!facetPath("vm", "engine").includes("category-1"));
  assert.equal(applicationSchema.safeParse("vnl-860").success, false);
  assert.equal(applicationSchema.safeParse("vm").success, true);
  for (const value of ["../admin", "Brakes", "brakes/x", "a b"])
    assert.equal(systemSchema.safeParse(value).success, false, value);
});

test("systems drop empty facets and are ranked by volume", () => {
  const payload = facetsSchema.parse({
    facets: [
      {
        key: "category-2",
        values: [
          { value: "brakes", name: "Brakes", quantity: 25 },
          { value: "engine", name: "Engine", quantity: 79 },
          { value: "cab", name: "Cab", quantity: 0 },
        ],
      },
      {
        key: "brand",
        values: [{ value: "volvo", name: "Volvo", quantity: 84 }],
      },
      // La facette price rend des valeurs nulles : elle ne doit pas faire
      // échouer toute la réponse.
      { key: "price", values: [{ value: null, name: null, quantity: 30 }] },
    ],
  });
  assert.deepEqual(readSystems(payload), [
    { slug: "engine", label: "Engine", count: 79 },
    { slug: "brakes", label: "Brakes", count: 25 },
  ]);
});

test("parts keep the RefId join key, the default seller and uncut prices", () => {
  const payload = partSearchSchema.parse({
    recordsFiltered: 2,
    products: [
      {
        productId: "802",
        productName: "Relay Valve",
        productReference: "21811707",
        items: [
          {
            itemId: "902",
            images: [{ imageUrl: "https://volvoemea.vtexassets.com/a.jpg" }],
            referenceId: [
              { Key: "Other", Value: "ignore-me" },
              { Key: "RefId", Value: "21811707" },
            ],
            sellers: [
              {
                sellerId: "9",
                commertialOffer: {
                  Price: 1,
                  ListPrice: 1,
                  AvailableQuantity: 1,
                },
              },
              {
                sellerId: "1",
                sellerDefault: true,
                commertialOffer: {
                  Price: 626.47,
                  ListPrice: 696.08,
                  AvailableQuantity: 10000,
                },
              },
            ],
          },
        ],
      },
      {
        productId: "803",
        productName: "Unreferenced part",
        items: [{ itemId: "903", sellers: [], referenceId: [] }],
      },
    ],
  });
  const parts = readParts(payload);
  // Le produit sans référence ni vendeur ne pourrait pas rejoindre le panier.
  assert.equal(parts.length, 1);
  assert.equal(parts[0].reference, "21811707");
  // Intelligent Search rend des unités monétaires, pas des centimes.
  assert.equal(parts[0].price, 626.47);
  assert.equal(partMoney(626.47, "USD"), "$626.47");
  assert.equal(partMoney(626.47, undefined), "626.47");
  assert.equal(partMoney(null, "USD"), "Price unavailable");
});

test("the catalogue client is anonymous, bounded and fails loud", async (t) => {
  let status = 200;
  let body: unknown = { facets: [] };
  const seen: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    seen.push(url);
    // Endpoint public : aucun cookie ni clé applicative ne doit partir.
    const headers = new Headers(init.headers);
    assert.equal(headers.get("Cookie"), null);
    assert.equal(headers.get("VtexIdclientAutCookie_volvoemea"), null);
    assert.equal(init.cache, "no-store");
    return Response.json(body, { status });
  });

  assert.deepEqual(await listVehicleSystems("fh13-classic"), []);
  assert.ok(
    seen[0].startsWith(
      "https://volvoemea.vtexcommercestable.com.br/api/io/_v/api/intelligent-search/facets/trade-policy/1/application/fh13-classic",
    ),
    seen[0],
  );

  body = { recordsFiltered: 0, products: [] };
  const empty = await searchVehicleParts("vm", "brakes", 1);
  assert.equal(empty.total, 0);
  assert.ok(seen[1].includes("/application/vm/category-2/brakes"));
  assert.ok(seen[1].includes("count=12"));

  status = 500;
  await assert.rejects(searchVehicleParts("vm", undefined, 1), {
    code: "PARTS_UNAVAILABLE",
  });
  status = 200;
  body = { products: "not an array" };
  await assert.rejects(searchVehicleParts("vm", undefined, 1), {
    code: "PARTS_FORMAT",
  });
  await assert.rejects(searchVehicleParts("vm", "../admin", 1));
});
