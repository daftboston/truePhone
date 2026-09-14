/**
 * @file explore-stock.ts
 * @description Pure formatters for Explorar catalog stock and floor prices.
 * @dependencies none
 */

export type ExploreModelStock = {
  count: number;
  minBuyerPrice: number | null;
};

/**
 * formatExploreCop
 *
 * Formats a COP amount the same way listing cards do (es-CO, no cents).
 *
 * @param value - Integer pesos.
 * @returns Localized currency string.
 * @calledBy formatExploreModelStock
 */
export function formatExploreCop(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * formatExploreModelStock
 *
 * Builds the card meta line for a catalog model.
 *
 * @param stock - Published listing count and optional buyer-price floor.
 * @returns Spanish stock line.
 * @calledBy ExploreModelCard
 *
 * @example
 * formatExploreModelStock({ count: 0, minBuyerPrice: null }); // "Sin anuncios"
 */
export function formatExploreModelStock(stock: ExploreModelStock) {
  if (stock.count <= 0) return "Sin anuncios";
  if (stock.count === 1) return "1 anuncio";
  if (stock.minBuyerPrice == null) {
    return `${stock.count} anuncios`;
  }
  return `${stock.count} anuncios · desde ${formatExploreCop(stock.minBuyerPrice)}`;
}

/**
 * formatExploreSeriesModelCount
 *
 * Labels how many catalog SKUs sit in a series (not published inventory).
 *
 * @param modelCount - Catalog models in the series.
 * @returns Spanish series subtitle.
 * @calledBy ExploreSeriesSection
 */
export function formatExploreSeriesModelCount(modelCount: number) {
  return modelCount === 1 ? "1 modelo" : `${modelCount} modelos`;
}
