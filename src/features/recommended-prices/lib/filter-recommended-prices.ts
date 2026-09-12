/**
 * @file filter-recommended-prices.ts
 * @description Pure filter for the admin recommended-price table.
 * @dependencies none
 */

export type RecommendedPriceSearchRow = {
  iphoneModel: { name: string };
  iphoneStorage: { valueGb: number };
  condition: string;
};

/**
 * filterRecommendedPrices
 *
 * Keeps rows whose model, storage, or condition match the query.
 *
 * @param rows - Catalog-joined recommended price rows.
 * @param query - Free-text search from the admin table.
 * @returns Matching rows, or all rows when the query is blank.
 * @calledBy AdminRecommendedPricesPage
 */
export function filterRecommendedPrices<T extends RecommendedPriceSearchRow>(
  rows: T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;

  return rows.filter((row) => {
    const haystack =
      `${row.iphoneModel.name} ${row.iphoneStorage.valueGb} ${row.condition}`.toLowerCase();
    return haystack.includes(needle);
  });
}
