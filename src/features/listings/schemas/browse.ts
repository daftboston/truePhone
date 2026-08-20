/**
 * @file browse.ts
 * @description Zod schemas and related types for listings (browse.ts).
 * @dependencies @prisma/client, zod
 */

import { Condition } from "@prisma/client";
import { z } from "zod";

/** BROWSE_PAGE_SIZE — validates input for related BROWSE_PAGE_SIZE flows. */
export const BROWSE_PAGE_SIZE = 12;

/** browseSortSchema — validates input for related browseSort flows. */
export const browseSortSchema = z.enum(["newest", "price_asc", "price_desc"]);
export type BrowseSort = z.infer<typeof browseSortSchema>;

/** browsePriceBandSchema — validates input for related browsePriceBand flows. */
export const browsePriceBandSchema = z.enum([
  "under_1500",
  "1500_2500",
  "2500_4000",
  "over_4000",
]);
export type BrowsePriceBand = z.infer<typeof browsePriceBandSchema>;

export const BROWSE_PRICE_BANDS: {
  id: BrowsePriceBand;
  label: string;
  minPrice?: number;
  maxPrice?: number;
}[] = [
  { id: "under_1500", label: "Hasta $1.5M", maxPrice: 1_500_000 },
  {
    id: "1500_2500",
    label: "$1.5M – $2.5M",
    minPrice: 1_500_000,
    maxPrice: 2_500_000,
  },
  {
    id: "2500_4000",
    label: "$2.5M – $4M",
    minPrice: 2_500_000,
    maxPrice: 4_000_000,
  },
  { id: "over_4000", label: "Más de $4M", minPrice: 4_000_000 },
];

export const browseSortOptions: { id: BrowseSort; label: string }[] = [
  { id: "newest", label: "Más recientes" },
  { id: "price_asc", label: "Menor precio" },
  { id: "price_desc", label: "Mayor precio" },
];

const conditionEnum = z.nativeEnum(Condition);

export type BrowseQuery = {
  q: string;
  modelId: string;
  /** Generation key from catalog (`16`, `15`, `se`, …). */
  seriesKey: string;
  storageId: string;
  condition: Condition | "";
  price: BrowsePriceBand | "";
  sort: BrowseSort;
  page: number;
};

/**
 * parseBrowseSearchParams
 *
 * Supports listings by implementing parseBrowseSearchParams.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
export function parseBrowseSearchParams(
  params: Record<string, string | string[] | undefined>,
): BrowseQuery {
  const raw = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : "";
  };

  const sortParsed = browseSortSchema.safeParse(raw("sort") || "newest");
  const priceParsed = browsePriceBandSchema.safeParse(raw("price"));
  const conditionParsed = conditionEnum.safeParse(raw("condition"));
  const pageNum = Number.parseInt(raw("page") || "1", 10);

  return {
    q: raw("q").trim().slice(0, 120),
    modelId: raw("model").trim(),
    seriesKey: raw("series").trim().toLowerCase(),
    storageId: raw("storage").trim(),
    condition: conditionParsed.success ? conditionParsed.data : "",
    price: priceParsed.success ? priceParsed.data : "",
    sort: sortParsed.success ? sortParsed.data : "newest",
    page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
  };
}

/**
 * buildBrowseHref
 *
 * Supports listings by implementing buildBrowseHref.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
export function buildBrowseHref(
  query: BrowseQuery,
  patch: Partial<BrowseQuery> = {},
) {
  const next: BrowseQuery = { ...query, ...patch };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.modelId) params.set("model", next.modelId);
  if (next.seriesKey && !next.modelId) params.set("series", next.seriesKey);
  if (next.storageId) params.set("storage", next.storageId);
  if (next.condition) params.set("condition", next.condition);
  if (next.price) params.set("price", next.price);
  if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));

  const qs = params.toString();
  return qs ? `/buscar?${qs}` : "/buscar";
}

/** Browse requires a model, series, or free-text query. */
export function hasBrowseScope(query: BrowseQuery) {
  return Boolean(query.modelId || query.seriesKey || query.q);
}

/**
 * priceBandBounds
 *
 * Supports listings by implementing priceBandBounds.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
export function priceBandBounds(band: BrowsePriceBand | "") {
  if (!band) return { minPrice: undefined, maxPrice: undefined };
  const found = BROWSE_PRICE_BANDS.find((item) => item.id === band);
  return {
    minPrice: found?.minPrice,
    maxPrice: found?.maxPrice,
  };
}
