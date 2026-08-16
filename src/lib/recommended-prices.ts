/**
 * @file recommended-prices.ts
 * @description Query helpers for admin-maintained recommended iPhone prices.
 * @dependencies @prisma/client, @/lib/db, @/features/recommended-prices/types
 */

import type { Condition, Prisma } from "@prisma/client";

import {
  sellerPriceGuideKey,
  type SellerPriceGuideEntry,
} from "@/features/recommended-prices/types";
import { prisma } from "@/lib/db";

export type { SellerPriceGuideEntry };
export { sellerPriceGuideKey };

const recommendedPriceInclude = {
  iphoneModel: true,
  iphoneStorage: true,
} satisfies Prisma.RecommendedPriceInclude;

export type RecommendedPriceWithCatalog = Prisma.RecommendedPriceGetPayload<{
  include: typeof recommendedPriceInclude;
}>;

/**
 * isRecommendedPriceEffective
 *
 * Returns whether a row is active at `at` given optional effective window.
 *
 * @param row - Recommended price with optional from/to dates.
 * @param at - Instant to evaluate; defaults to now.
 * @returns True when no window or `at` falls inside [from, to].
 * @calledBy listRecommendedPrices, getRecommendedPriceForCombo, getSellerPriceGuideMap
 */
export function isRecommendedPriceEffective(
  row: { effectiveFrom: Date | null; effectiveTo: Date | null },
  at: Date = new Date(),
): boolean {
  if (row.effectiveFrom && row.effectiveFrom.getTime() > at.getTime()) {
    return false;
  }
  if (row.effectiveTo && row.effectiveTo.getTime() < at.getTime()) {
    return false;
  }
  return true;
}

/**
 * listRecommendedPrices
 *
 * Loads all recommended price rows with catalog relations for admin UI.
 *
 * @returns Rows ordered by model name, storage, condition.
 * @calledBy AdminRecommendedPricesPage
 * @consumers Phase 13 admin table
 */
export async function listRecommendedPrices(): Promise<
  RecommendedPriceWithCatalog[]
> {
  return prisma.recommendedPrice.findMany({
    include: recommendedPriceInclude,
    orderBy: [
      { iphoneModel: { name: "asc" } },
      { iphoneStorage: { valueGb: "asc" } },
      { condition: "asc" },
    ],
  });
}

/**
 * countRecommendedPrices
 *
 * Counts recommended price guide rows.
 *
 * @returns Total row count.
 * @calledBy ReviewHubPage
 */
export async function countRecommendedPrices(): Promise<number> {
  return prisma.recommendedPrice.count();
}

/**
 * getRecommendedPriceById
 *
 * Loads one recommended price by id for admin edit prefills.
 *
 * @param id - RecommendedPrice id.
 * @returns Row with catalog relations, or null.
 * @calledBy AdminRecommendedPricesPage
 */
export async function getRecommendedPriceById(
  id: string,
): Promise<RecommendedPriceWithCatalog | null> {
  return prisma.recommendedPrice.findUnique({
    where: { id },
    include: recommendedPriceInclude,
  });
}

/**
 * getRecommendedPriceForCombo
 *
 * Resolves the seller-facing reference for model + storage + condition.
 * Skips rows outside their effective window.
 *
 * @param input.iphoneModelId - Catalog model id.
 * @param input.iphoneStorageId - Catalog storage id.
 * @param input.condition - Listing Condition enum.
 * @param input.at - Optional evaluation time (defaults to now).
 * @returns Effective recommended price row, or null when none / expired.
 * @calledBy Seller price guide lookups that need a single row
 * @consumers Sell-flow reference display
 */
export async function getRecommendedPriceForCombo(input: {
  iphoneModelId: string;
  iphoneStorageId: string;
  condition: Condition;
  at?: Date;
}): Promise<RecommendedPriceWithCatalog | null> {
  const row = await prisma.recommendedPrice.findUnique({
    where: {
      iphoneModelId_iphoneStorageId_condition: {
        iphoneModelId: input.iphoneModelId,
        iphoneStorageId: input.iphoneStorageId,
        condition: input.condition,
      },
    },
    include: recommendedPriceInclude,
  });

  if (!row) return null;
  if (!isRecommendedPriceEffective(row, input.at ?? new Date())) return null;
  return row;
}

/**
 * getSellerPriceGuideMap
 *
 * Loads effective recommended prices as a client-safe map for the sell wizard.
 * Excludes expired / not-yet-effective rows and admin-only notes.
 *
 * @param at - Optional evaluation time (defaults to now).
 * @returns Map keyed by `sellerPriceGuideKey` → reference price + optional band.
 * @calledBy NewListingPage, EditDevicePage
 * @consumers DeviceDetailsForm / SellerPriceGuide
 */
export async function getSellerPriceGuideMap(
  at: Date = new Date(),
): Promise<Record<string, SellerPriceGuideEntry>> {
  const rows = await prisma.recommendedPrice.findMany({
    select: {
      iphoneModelId: true,
      iphoneStorageId: true,
      condition: true,
      priceCop: true,
      minPriceCop: true,
      maxPriceCop: true,
      effectiveFrom: true,
      effectiveTo: true,
    },
  });

  const map: Record<string, SellerPriceGuideEntry> = {};
  for (const row of rows) {
    if (!isRecommendedPriceEffective(row, at)) continue;
    map[
      sellerPriceGuideKey(row.iphoneModelId, row.iphoneStorageId, row.condition)
    ] = {
      priceCop: row.priceCop,
      minPriceCop: row.minPriceCop,
      maxPriceCop: row.maxPriceCop,
    };
  }
  return map;
}
