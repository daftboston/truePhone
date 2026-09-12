/**
 * @file filter-faq.ts
 * @description Pure FAQ cluster filter for the public /ayuda search field.
 * @dependencies @/lib/help/faq
 */

import type { FaqCluster } from "@/lib/help/faq";

/**
 * filterFaqClusters
 *
 * Keeps clusters that still have a question or answer matching the query.
 * An empty query returns the original list unchanged.
 *
 * @param clusters - Canonical FAQ groups.
 * @param query - Free-text search from the help input.
 * @returns Clusters with unmatched items removed.
 * @calledBy FaqList
 *
 * @example
 * filterFaqClusters(FAQ_CLUSTERS, "IMEI");
 */
export function filterFaqClusters(clusters: FaqCluster[], query: string) {
  const needle = query.trim().toLocaleLowerCase("es-CO");
  if (!needle) return clusters;

  return clusters
    .map((cluster) => ({
      ...cluster,
      items: cluster.items.filter((item) => {
        const haystack = `${item.question} ${item.answer}`.toLocaleLowerCase(
          "es-CO",
        );
        return haystack.includes(needle);
      }),
    }))
    .filter((cluster) => cluster.items.length > 0);
}
