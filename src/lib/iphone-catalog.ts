/**
 * @file iphone-catalog.ts
 * @description Client-safe iPhone catalog grouping, typeahead matching, storage labels, and glyph face styles.
 * @dependencies none
 */

import type {
  IphoneProductLineId,
  IphoneVariantTypeId,
} from "@/lib/iphone-catalog-data";

export type CatalogModel = {
  id: string;
  name: string;
  slug: string;
  productLine: IphoneProductLineId;
  generation: number;
  variantType: IphoneVariantTypeId;
  releaseYear: number | null;
};

export type ModelSeries = {
  key: string;
  label: string;
  sort: number;
  models: CatalogModel[];
};

export type IphoneFaceStyle = "home" | "notch" | "island";

const VARIANT_SORT: Record<IphoneVariantTypeId, number> = {
  MINI: 1,
  STANDARD: 2,
  PLUS: 3,
  PRO: 4,
  PRO_MAX: 5,
  E: 6,
  AIR: 2,
};

const PRODUCT_LINE_RANK: Record<IphoneProductLineId, number> = {
  IPHONE_AIR: 2,
  IPHONE: 1,
  IPHONE_SE: 0,
};

/**
 * getIphoneFaceStyle
 *
 * Chooses the silhouette face for catalog glyphs (home button, notch, or island).
 *
 * @param model.productLine - Independent commercial line.
 * @param model.generation - Generation within that line.
 * @param model.variantType - Size/finish variant.
 * @returns Face style used by IphoneModelGlyph.
 * @calledBy IphoneModelGlyph, explore model cards
 */
export function getIphoneFaceStyle(model: {
  productLine: IphoneProductLineId;
  generation: number;
  variantType: IphoneVariantTypeId;
}): IphoneFaceStyle {
  if (model.productLine === "IPHONE_SE") return "home";
  if (model.productLine === "IPHONE_AIR") return "island";
  if (model.generation <= 13) return "notch";
  if (model.generation === 16 && model.variantType === "E") return "notch";
  if (
    model.generation === 14 &&
    (model.variantType === "STANDARD" || model.variantType === "PLUS")
  ) {
    return "notch";
  }
  return "island";
}

/**
 * normalizeSearch
 *
 * Normalizes text for accent-insensitive catalog search.
 *
 * @param value - Raw search string.
 * @returns Lowercased alphanumeric search text.
 */
function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * formatStorageLabel
 *
 * Formats a capacity in GB as a user-facing GB/TB label.
 *
 * @param valueGb - Storage size in gigabytes.
 * @returns Localized capacity label (e.g. "256 GB", "1 TB").
 * @calledBy DeviceDetailsForm, BrowseFilters, RecommendedPriceForm
 */
export function formatStorageLabel(valueGb: number): string {
  if (valueGb >= 1024 && valueGb % 1024 === 0) {
    return `${valueGb / 1024} TB`;
  }
  return `${valueGb} GB`;
}

/**
 * getModelSeriesKey
 *
 * Resolves browse/explore series from product line + generation.
 * SE and Air stay on their own lines; they are never folded into 13/14/17.
 *
 * @param model - Catalog model with product-line fields.
 * @returns Series key, Spanish label, and sort weight.
 * @calledBy groupModelsBySeries, matchModelsForSearch, SearchPage
 */
export function getModelSeriesKey(model: CatalogModel): {
  key: string;
  label: string;
  sort: number;
} {
  if (model.productLine === "IPHONE_SE") {
    return { key: "se", label: "Serie iPhone SE", sort: 0 };
  }

  if (model.productLine === "IPHONE_AIR") {
    return { key: "air", label: "iPhone Air", sort: 16.9 };
  }

  return {
    key: String(model.generation),
    label: `Serie iPhone ${model.generation}`,
    sort: model.generation,
  };
}

/**
 * groupModelsBySeries
 *
 * Groups catalog models into product-line series (not name-parsed generations).
 *
 * @param models - Catalog model rows.
 * @returns ModelSeries array newest family first.
 * @calledBy Listing create/browse model pickers
 */
export function groupModelsBySeries(models: CatalogModel[]): ModelSeries[] {
  const byKey = new Map<string, ModelSeries>();

  for (const model of models) {
    const meta = getModelSeriesKey(model);
    const existing = byKey.get(meta.key);
    if (existing) {
      existing.models.push(model);
      continue;
    }
    byKey.set(meta.key, {
      key: meta.key,
      label: meta.label,
      sort: meta.sort,
      models: [model],
    });
  }

  return [...byKey.values()]
    .map((series) => {
      const maxYear = Math.max(
        ...series.models.map((model) => model.releaseYear ?? 0),
      );
      const lineRank = Math.max(
        ...series.models.map(
          (model) => PRODUCT_LINE_RANK[model.productLine] ?? 0,
        ),
      );
      return {
        ...series,
        sort: maxYear * 10 + lineRank,
        models: [...series.models].sort((a, b) => {
          const variantDelta =
            VARIANT_SORT[a.variantType] - VARIANT_SORT[b.variantType];
          if (variantDelta !== 0) return variantDelta;
          return a.name.localeCompare(b.name, "es");
        }),
      };
    })
    .sort((a, b) => b.sort - a.sort);
}

/**
 * matchModelsForSearch
 *
 * Typeahead matching: product-line queries return that line; model queries narrow within it.
 *
 * @param models - Catalog models to search.
 * @param query - User typeahead input.
 * @returns Matching CatalogModel list.
 * @calledBy Model search UI
 */
export function matchModelsForSearch(
  models: CatalogModel[],
  query: string,
): CatalogModel[] {
  const q = normalizeSearch(query);
  if (!q) return [];

  if (/\bse\b/.test(q)) {
    const seModels = models.filter(
      (model) => model.productLine === "IPHONE_SE",
    );
    const genMatch = q.match(/\b([23])\b/);
    if (genMatch) {
      const generation = Number(genMatch[1]);
      return seModels.filter((model) => model.generation === generation);
    }
    return seModels;
  }

  if (/\bair\b/.test(q)) {
    return models.filter((model) => model.productLine === "IPHONE_AIR");
  }

  const seriesMatch = q.match(/(?:iphone\s*)?(1[2-7])\b/);
  if (seriesMatch) {
    const generation = Number(seriesMatch[1]);
    const inSeries = models.filter(
      (model) =>
        model.productLine === "IPHONE" && model.generation === generation,
    );

    const remainder = q
      .replace(/\biphone\b/g, " ")
      .replace(new RegExp(`\\b${seriesMatch[1]}\\b`), " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!remainder) {
      return inSeries;
    }

    return inSeries.filter((model) =>
      normalizeSearch(model.name).includes(remainder),
    );
  }

  return models.filter((model) => normalizeSearch(model.name).includes(q));
}

/**
 * browseModelHref
 *
 * Builds marketplace browse URL filtered to one model.
 *
 * @param modelId - iPhoneModel UUID.
 * @returns Path with query string.
 * @calledBy Catalog browse links
 */
export function browseModelHref(modelId: string) {
  return `/buscar?model=${encodeURIComponent(modelId)}`;
}

/**
 * browseSeriesHref
 *
 * Builds marketplace browse URL filtered to a product-line series key.
 *
 * @param seriesKey - Series key from getModelSeriesKey.
 * @returns Path with query string.
 * @calledBy Catalog series chips
 */
export function browseSeriesHref(seriesKey: string) {
  return `/buscar?series=${encodeURIComponent(seriesKey)}`;
}
