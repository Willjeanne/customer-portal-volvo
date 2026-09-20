/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « flotte de démonstration », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-FLOTTE.md.
 *     Fixtures et compatibilité approximative assumées : démonstration.
 */
import { z } from "zod";

/**
 * Slugs de la facette Intelligent Search `application`, relevés en production le
 * 20/09/2026 sur volvoemea. `catalogCount` est le nombre de produits retournés
 * SANS épingler `category-1` : l'épinglage en perd (323 → 313 sur fh13-classic),
 * parce que 175 produits portent une category-1 qui contredit leurs modèles.
 *
 * Cette liste est la seule autorité sur les modèles utilisables : le type
 * `TruckApplication` en dérive, donc une fixture de flotte ne peut pas pointer un
 * modèle absent du catalogue sans échec de compilation.
 */
export const truckApplications = {
  vm: { label: "VM", catalogCount: 465 },
  "fh12-classic": { label: "FH12 Classic", catalogCount: 372 },
  "fm12-classic": { label: "FM12 Classic", catalogCount: 332 },
  "fh13-classic": { label: "FH13 Classic", catalogCount: 323 },
  "fm13-classic": { label: "FM13 Classic", catalogCount: 305 },
  "nh12-classic": { label: "NH12 Classic", catalogCount: 284 },
  "fh13-new": { label: "FH13 New", catalogCount: 277 },
  "fm11-classic": { label: "FM11 Classic", catalogCount: 265 },
  "fm13-new": { label: "FM13 New", catalogCount: 221 },
  "fm11-new": { label: "FM11 New", catalogCount: 172 },
  "fh-new": { label: "FH New", catalogCount: 117 },
} as const;

export type TruckApplication = keyof typeof truckApplications;

const applicationValues = Object.keys(truckApplications) as [
  TruckApplication,
  ...TruckApplication[],
];

export const applicationSchema = z.enum(applicationValues);
/** Les valeurs de `category-2` sont des slugs Intelligent Search, jamais une saisie libre. */
export const systemSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,59}$/);
export const partsPageSchema = z.number().int().min(1).max(50);

export const PARTS_PAGE_SIZE = 12;

/**
 * Chemin de facettes Intelligent Search. `category-1` n'est volontairement pas
 * épinglé — voir le commentaire de `truckApplications`.
 */
export function facetPath(
  application: TruckApplication,
  system?: string,
): string {
  const base = `/application/${encodeURIComponent(application)}`;
  return system ? `${base}/category-2/${encodeURIComponent(system)}` : base;
}

const offerSchema = z.object({
  Price: z.number().finite().nullable(),
  ListPrice: z.number().finite().nullable(),
  AvailableQuantity: z.number().int().nonnegative(),
});
const sellerSchema = z.object({
  sellerId: z.string(),
  sellerDefault: z.boolean().optional(),
  commertialOffer: offerSchema,
});
const itemSchema = z.object({
  itemId: z.string(),
  images: z
    .array(z.object({ imageUrl: z.string(), imageLabel: z.string().nullish() }))
    .nullish(),
  referenceId: z
    .array(z.object({ Key: z.string(), Value: z.string() }))
    .nullish(),
  sellers: z.array(sellerSchema),
});
const productSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productReference: z.string().nullish(),
  items: z.array(itemSchema).min(1),
});

export const partSearchSchema = z.object({
  products: z.array(productSchema),
  recordsFiltered: z.number().int().nonnegative(),
});
/**
 * La facette `price` rend des valeurs nulles : le schéma doit les tolérer, sinon
 * toute la réponse est rejetée et les systèmes disparaissent de la fiche véhicule.
 */
export const facetsSchema = z.object({
  facets: z.array(
    z.object({
      key: z.string(),
      values: z.array(
        z.object({
          value: z.string().nullish(),
          name: z.string().nullish(),
          quantity: z.number().int().nonnegative(),
        }),
      ),
    }),
  ),
});

export interface VehicleSystem {
  slug: string;
  label: string;
  count: number;
}

export interface Part {
  productId: string;
  /** RefId du SKU : la clé que la préparation de panier sait résoudre. */
  reference: string;
  name: string;
  imageUrl: string | null;
  /** Unités monétaires, PAS des centimes — contrairement aux réponses OMS. */
  price: number | null;
  listPrice: number | null;
  available: number;
}

export function readSystems(
  payload: z.infer<typeof facetsSchema>,
): VehicleSystem[] {
  const facet = payload.facets.find((entry) => entry.key === "category-2");
  return (facet?.values ?? [])
    .flatMap((value) =>
      value.quantity > 0 && value.value
        ? [
            {
              slug: value.value,
              label: value.name || value.value,
              count: value.quantity,
            },
          ]
        : [],
    )
    .sort((a, b) => b.count - a.count);
}

export function readParts(payload: z.infer<typeof partSearchSchema>): Part[] {
  return payload.products.flatMap((product) => {
    const item = product.items[0];
    const seller =
      item.sellers.find((entry) => entry.sellerDefault) ?? item.sellers[0];
    const reference =
      item.referenceId?.find((entry) => entry.Key === "RefId")?.Value ||
      product.productReference ||
      "";
    // Sans référence, la ligne ne pourrait pas rejoindre le panier : on l'écarte.
    if (!reference || !seller) return [];
    return [
      {
        productId: product.productId,
        reference,
        name: product.productName,
        imageUrl: item.images?.[0]?.imageUrl ?? null,
        price: seller.commertialOffer.Price,
        listPrice: seller.commertialOffer.ListPrice,
        available: seller.commertialOffer.AvailableQuantity,
      },
    ];
  });
}

/** Aucune devise n'est inventée : sans devise de session, on affiche le nombre seul. */
export function partMoney(
  value: number | null,
  currency: string | undefined,
): string {
  if (value === null) return "Price unavailable";
  return new Intl.NumberFormat(
    "en-US",
    currency
      ? { style: "currency", currency }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  ).format(value);
}

// >>> CLAUDE — lot find parts, 20/09/2026 — à relire
// Recherche libre, sans modèle imposé : tout ce qui précède exige un
// `TruckApplication` parce que le lot flotte partait toujours d'un camion.
// L'écran /parts, lui, démarre d'un texte ou de rien du tout.

/** Valeur de facette telle qu'Intelligent Search la rend : un slug, jamais une saisie. */
export const facetValueSchema = z.string().regex(/^[a-z0-9][a-z0-9.-]{0,79}$/);

/**
 * Facettes proposées à l'utilisateur, dans l'ordre d'affichage.
 *
 * Volontairement absentes :
 * - `category-1` — 175 produits portent une catégorie qui contredit leurs
 *   modèles ; l'épingler fait perdre des résultats (323 → 313 sur fh13-classic).
 * - `application-menu` — mêle des positions (Rear/Central/Front) et des séries
 *   (FH, FM, VM) ; inexploitable comme filtre.
 * - `price` — valeurs nulles, `brand` — une seule valeur, `search` — mot-clé.
 *
 * `part-type` (camions) et `type` (bus) sont le même concept sous deux noms :
 * Intelligent Search en fait deux facettes distinctes, on les affiche toutes deux.
 */
export const displayedFacets: { key: string; label: string }[] = [
  { key: "application", label: "Model" },
  { key: "category-2", label: "System" },
  { key: "category-3", label: "Sub-system" },
  { key: "part-type", label: "Part type" },
  { key: "type", label: "Part type" },
];

export interface SelectedFacet {
  key: string;
  value: string;
}

export interface FacetGroup {
  key: string;
  label: string;
  values: { value: string; label: string; count: number }[];
}

export const searchInput = z.object({
  query: z.string().trim().max(120).default(""),
  facets: z
    .array(z.object({ key: z.string(), value: facetValueSchema }))
    .max(6),
  page: partsPageSchema,
});
export type SearchInput = z.infer<typeof searchInput>;

/** Chemin de facettes sélectionnées, dans l'ordre stable de `displayedFacets`. */
export function selectedFacetPath(facets: SelectedFacet[]): string {
  const order = displayedFacets.map((entry) => entry.key);
  return [...facets]
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
    .map(
      (facet) =>
        `/${encodeURIComponent(facet.key)}/${encodeURIComponent(facet.value)}`,
    )
    .join("");
}

/** `f=application:fh13-classic` dans l'URL → facette sélectionnée, ou rien. */
export function parseSelectedFacets(
  raw: string | string[] | undefined,
): SelectedFacet[] {
  const entries = typeof raw === "string" ? [raw] : (raw ?? []);
  const known = new Set(displayedFacets.map((entry) => entry.key));
  const seen = new Set<string>();
  return entries.flatMap((entry) => {
    const separator = entry.indexOf(":");
    if (separator < 1) return [];
    const key = entry.slice(0, separator);
    const value = entry.slice(separator + 1);
    // Une facette inconnue, une valeur non conforme ou un doublon sont ignorés
    // en silence : l'URL est une entrée utilisateur comme une autre.
    if (!known.has(key) || seen.has(key)) return [];
    if (!facetValueSchema.safeParse(value).success) return [];
    seen.add(key);
    return [{ key, value }];
  });
}

/** Groupes affichables, vidés des valeurs nulles ou à zéro résultat. */
export function readFacetGroups(
  payload: z.infer<typeof facetsSchema>,
): FacetGroup[] {
  return displayedFacets.flatMap(({ key, label }) => {
    const facet = payload.facets.find((entry) => entry.key === key);
    const values = (facet?.values ?? []).flatMap((entry) =>
      entry.quantity > 0 && entry.value
        ? [
            {
              value: entry.value,
              label: entry.name || entry.value,
              count: entry.quantity,
            },
          ]
        : [],
    );
    return values.length
      ? [{ key, label, values: values.sort((a, b) => b.count - a.count) }]
      : [];
  });
}
// <<< CLAUDE
