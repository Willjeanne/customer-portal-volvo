/**
 * ⚠️  ÉCRIT PAR CLAUDE — lot « flotte de démonstration », 20/09/2026.
 *     À RELIRE AVANT INTÉGRATION. Voir docs/HANDOFF-FLOTTE.md.
 *     Fixtures et compatibilité approximative assumées : démonstration.
 *
 * Client Intelligent Search. L'endpoint est public : il ne porte ni cookie ni
 * clé applicative, et ne peut donc rien lire de privé. L'origine est celle que
 * `cart.ts` utilise déjà — aucune origine supplémentaire n'est introduite.
 */
import "server-only";
import type { z } from "zod";
import {
  PARTS_PAGE_SIZE,
  applicationSchema,
  facetPath,
  facetsSchema,
  partSearchSchema,
  partsPageSchema,
  readFacetGroups,
  readParts,
  readSystems,
  searchInput,
  selectedFacetPath,
  systemSchema,
  type FacetGroup,
  type Part,
  type SearchInput,
  type TruckApplication,
  type VehicleSystem,
} from "../domain/parts";
import { PortalError } from "./security";

const ORIGIN = "https://volvoemea.vtexcommercestable.com.br";
const BASE = `${ORIGIN}/api/io/_v/api/intelligent-search`;
/** Unique politique commerciale du compte : id 1, USA, USD. */
const TRADE_POLICY = "1";

async function read<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new PortalError(
      502,
      "PARTS_UNAVAILABLE",
      "The parts catalogue could not be reached. Please try again.",
    );
  }
  if (!response.ok)
    throw new PortalError(
      502,
      "PARTS_UNAVAILABLE",
      `The parts catalogue did not answer (HTTP ${response.status}).`,
    );
  const payload: unknown = await response.json().catch(() => {
    throw new PortalError(
      502,
      "PARTS_RESPONSE",
      "The parts catalogue returned a non-JSON response.",
    );
  });
  const parsed = schema.safeParse(payload);
  if (!parsed.success)
    throw new PortalError(
      502,
      "PARTS_FORMAT",
      "The parts catalogue returned an unexpected format.",
    );
  return parsed.data;
}

/** Systèmes réellement disponibles pour ce modèle, lus sur la facette category-2. */
export async function listVehicleSystems(
  application: TruckApplication,
): Promise<VehicleSystem[]> {
  const model = applicationSchema.parse(application);
  const payload = await read(
    `/facets/trade-policy/${TRADE_POLICY}${facetPath(model)}?query=`,
    facetsSchema,
  );
  return readSystems(payload);
}

export async function searchVehicleParts(
  application: TruckApplication,
  system: string | undefined,
  page: number,
): Promise<{ parts: Part[]; total: number; pageSize: number; page: number }> {
  const model = applicationSchema.parse(application);
  const slug = system ? systemSchema.parse(system) : undefined;
  const safePage = partsPageSchema.parse(page);
  const query = new URLSearchParams({
    query: "",
    count: String(PARTS_PAGE_SIZE),
    page: String(safePage),
  });
  const payload = await read(
    `/product_search/trade-policy/${TRADE_POLICY}${facetPath(model, slug)}?${query}`,
    partSearchSchema,
  );
  return {
    parts: readParts(payload),
    total: payload.recordsFiltered,
    pageSize: PARTS_PAGE_SIZE,
    page: safePage,
  };
}

// >>> CLAUDE — lot find parts, 20/09/2026 — à relire
// Recherche libre de l'écran /parts. Facettes et produits sont lus en parallèle :
// `product_search` ne rend pas les facettes sur ce compte, il faut les deux appels.

export interface PartSearchResult {
  parts: Part[];
  total: number;
  page: number;
  pageSize: number;
  facets: FacetGroup[];
  /** Vrai quand la recherche n'a produit ni texte ni facette : on montre tout. */
  browsing: boolean;
}

export async function searchParts(
  input: SearchInput,
): Promise<PartSearchResult> {
  const { query, facets, page } = searchInput.parse(input);
  const path = selectedFacetPath(facets);
  const params = new URLSearchParams({ query });
  const productParams = new URLSearchParams({
    query,
    count: String(PARTS_PAGE_SIZE),
    page: String(page),
  });
  const [products, groups] = await Promise.all([
    read(
      `/product_search/trade-policy/${TRADE_POLICY}${path}?${productParams}`,
      partSearchSchema,
    ),
    read(`/facets/trade-policy/${TRADE_POLICY}${path}?${params}`, facetsSchema),
  ]);
  return {
    parts: readParts(products),
    total: products.recordsFiltered,
    page,
    pageSize: PARTS_PAGE_SIZE,
    facets: readFacetGroups(groups),
    browsing: query === "" && facets.length === 0,
  };
}
// <<< CLAUDE
