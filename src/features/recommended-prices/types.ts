/**
 * @file types.ts
 * @description Shared types for recommended price admin forms and seller guide UI.
 * @dependencies @prisma/client (Condition type only)
 */

import type { Condition } from "@prisma/client";

export type RecommendedPriceActionState =
  | {
      ok: true;
      message?: string;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

/** Lean seller-facing guide payload (no admin notes). */
export type SellerPriceGuideEntry = {
  priceCop: number;
  minPriceCop: number | null;
  maxPriceCop: number | null;
};

/**
 * sellerPriceGuideKey
 *
 * Builds the client lookup key for model + storage + condition.
 *
 * @param iphoneModelId - Catalog model id.
 * @param iphoneStorageId - Catalog storage id.
 * @param condition - Listing Condition enum.
 * @returns Stable composite key for the sell-wizard price guide map.
 * @calledBy getSellerPriceGuideMap, DeviceDetailsForm
 */
export function sellerPriceGuideKey(
  iphoneModelId: string,
  iphoneStorageId: string,
  condition: Condition,
): string {
  return `${iphoneModelId}:${iphoneStorageId}:${condition}`;
}
