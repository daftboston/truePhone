/**
 * @file iphone-catalog.ts
 * @description Client-safe iPhone model series grouping and typeahead matching.
 * @dependencies none
 */

export type CatalogModel = {
  id: string;
  name: string;
  slug: string;
  releaseYear: number | null;
};

export type ModelSeries = {
  key: string;
  label: string;
  sort: number;
  models: CatalogModel[];
};

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

/** Group catalog models into generation series (16, 15, SE, …). */
/**
 * getModelSeriesKey
 *
 * Group catalog models into generation series (16, 15, SE, …).
 *
 * @param name - iPhone model display name.
 * @returns Series key, Spanish label, and sort weight.
 * @calledBy groupModelsBySeries, matchModelsForSearch
 */
export function getModelSeriesKey(name: string): {
  key: string;
  label: string;
  sort: number;
} {
  if (/iphone\s+se/i.test(name)) {
    return { key: "se", label: "Serie iPhone SE", sort: 0 };
  }

  const match = name.match(/iPhone\s+(\d+)/i);
  if (match) {
    const generation = Number(match[1]);
    return {
      key: String(generation),
      label: `Serie iPhone ${generation}`,
      sort: generation,
    };
  }

  return { key: "other", label: "Otros modelos", sort: -1 };
}

/**
 * groupModelsBySeries
 *
 * Groups catalog models into sorted generation series.
 *
 * @param models - Catalog model rows.
 * @returns ModelSeries array newest generation first.
 * @calledBy Listing create/browse model pickers
 */
export function groupModelsBySeries(models: CatalogModel[]): ModelSeries[] {
  const byKey = new Map<string, ModelSeries>();

  for (const model of models) {
    const meta = getModelSeriesKey(model.name);
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
    .map((series) => ({
      ...series,
      models: [...series.models].sort((a, b) => {
        const yearDelta = (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
        if (yearDelta !== 0) return yearDelta;
        return a.name.localeCompare(b.name, "es");
      }),
    }))
    .sort((a, b) => b.sort - a.sort);
}

/**
 * Typeahead matching: typing a series (e.g. "iphone 14") returns that
 * series' models; typing a specific model narrows within the series.
 */
/**
 * matchModelsForSearch
 *
 * Typeahead matching: series queries return that series' models; model queries narrow within series.
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

  if (/\bse\b/.test(q) && !/\d/.test(q)) {
    return models.filter((model) => /iphone\s+se/i.test(model.name));
  }

  const seriesMatch = q.match(/(?:iphone\s*)?(\d{1,2})\b/);
  if (seriesMatch) {
    const seriesKey = seriesMatch[1];
    const inSeries = models.filter(
      (model) => getModelSeriesKey(model.name).key === seriesKey,
    );

    const remainder = q
      .replace(/\biphone\b/g, " ")
      .replace(new RegExp(`\\b${seriesKey}\\b`), " ")
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
 * Builds marketplace browse URL filtered to a generation series key.
 *
 * @param seriesKey - Series key from getModelSeriesKey.
 * @returns Path with query string.
 * @calledBy Catalog series chips
 */
export function browseSeriesHref(seriesKey: string) {
  return `/buscar?series=${encodeURIComponent(seriesKey)}`;
}
