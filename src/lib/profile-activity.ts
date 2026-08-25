/**
 * @file profile-activity.ts
 * @description Public listing/purchase counters and paid seller-cancel trust signal.
 * @dependencies @prisma/client, @/lib/db
 */

import { type ListingStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export type PublicActivityCounts = {
  total: number;
  active: number;
  bought: number;
  /** Orders where this profile is seller and abandoned fulfillment after pay. */
  paidSellerCancelCount: number;
};

const EMPTY_ACTIVITY: PublicActivityCounts = {
  total: 0,
  active: 0,
  bought: 0,
  paidSellerCancelCount: 0,
};

/**
 * summarizePublicActivity
 *
 * Applies locked public-count rules: drafts stay private; active is PUBLISHED;
 * bought is completed purchases as buyer.
 *
 * @param input.listingStatuses - Non-deleted listing statuses for the profile.
 * @param input.bought - Count of COMPLETED orders where the profile is buyer.
 * @param input.paidSellerCancelCount - Optional paid seller-abandon count.
 * @returns Total / active / bought / paid-cancel counters.
 * @calledBy profile-activity.test.ts
 */
export function summarizePublicActivity(input: {
  listingStatuses: ListingStatus[];
  bought: number;
  paidSellerCancelCount?: number;
}): PublicActivityCounts {
  return summarizePublicActivityFromGroups({
    groups: input.listingStatuses.map((status) => ({ status, count: 1 })),
    bought: input.bought,
    paidSellerCancelCount: input.paidSellerCancelCount,
  });
}

/**
 * summarizePublicActivityFromGroups
 *
 * Same rules as summarizePublicActivity, using grouped listing counts from Prisma.
 *
 * @param input.groups - Status → count for non-deleted listings.
 * @param input.bought - Count of COMPLETED orders where the profile is buyer.
 * @param input.paidSellerCancelCount - Optional paid seller-abandon count.
 * @returns Total / active / bought / paid-cancel counters.
 * @calledBy getPublicActivityCounts, summarizePublicActivity
 */
export function summarizePublicActivityFromGroups(input: {
  groups: { status: ListingStatus; count: number }[];
  bought: number;
  paidSellerCancelCount?: number;
}): PublicActivityCounts {
  let total = 0;
  let active = 0;
  for (const group of input.groups) {
    if (group.status === "DRAFT") continue;
    total += group.count;
    if (group.status === "PUBLISHED") active += group.count;
  }
  return {
    total,
    active,
    bought: input.bought,
    paidSellerCancelCount: input.paidSellerCancelCount ?? 0,
  };
}

/**
 * formatPublicActivityLabel
 *
 * Spanish one-line trust strip. Wording is locked in docs/plan.md.
 *
 * @param counts - Public activity counters.
 * @returns Copy like `Anuncios: 3 en total, 0 activos, 1 comprado`.
 * @calledBy PublicActivityStrip
 */
export function formatPublicActivityLabel(counts: PublicActivityCounts) {
  return `Anuncios: ${counts.total} en total, ${counts.active} activos, ${counts.bought} comprado`;
}

/**
 * formatPaidSellerCancelLabel
 *
 * Spanish trust-signal line for post-payment seller abandons. Hidden when zero.
 *
 * @param count - Orders with sellerFulfillmentAbandonedAt set for this seller.
 * @returns Copy like `Cancelaciones tras pago: 2`, or null when count ≤ 0.
 * @calledBy PublicActivityStrip
 */
export function formatPaidSellerCancelLabel(count: number) {
  if (count <= 0) return null;
  return `Cancelaciones tras pago: ${count}`;
}

/**
 * getPublicActivityCounts
 *
 * Loads listing status groups, completed-as-buyer orders, and paid seller cancels.
 *
 * @param profileId - Profile UUID.
 * @returns Public activity counters including paidSellerCancelCount.
 * @calledBy profile pages, getPublicActivityCountsByProfileIds
 */
export async function getPublicActivityCounts(profileId: string) {
  const [groups, bought, paidSellerCancelCount] = await Promise.all([
    prisma.listing.groupBy({
      by: ["status"],
      where: {
        sellerId: profileId,
        deletedAt: null,
      },
      _count: { _all: true },
    }),
    prisma.order.count({
      where: { buyerId: profileId, status: "COMPLETED" },
    }),
    // Seller abandoned fulfillment after payment (ops or legacy self-cancel).
    prisma.order.count({
      where: {
        sellerId: profileId,
        sellerFulfillmentAbandonedAt: { not: null },
      },
    }),
  ]);

  return summarizePublicActivityFromGroups({
    groups: groups.map((group) => ({
      status: group.status,
      count: group._count._all,
    })),
    bought,
    paidSellerCancelCount,
  });
}

/**
 * getPublicActivityCountsByProfileIds
 *
 * Loads public activity counters for several profiles (order buyer + seller).
 *
 * @param profileIds - Profile UUIDs (duplicates ignored).
 * @returns Map of profile id → counters; missing ids get zeros.
 * @calledBy getOrderPartyActivity
 */
export async function getPublicActivityCountsByProfileIds(
  profileIds: string[],
): Promise<Record<string, PublicActivityCounts>> {
  const unique = [...new Set(profileIds.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (id) => [id, await getPublicActivityCounts(id)] as const),
  );

  const result: Record<string, PublicActivityCounts> = {};
  for (const id of profileIds) {
    result[id] = EMPTY_ACTIVITY;
  }
  for (const [id, counts] of entries) {
    result[id] = counts;
  }
  return result;
}

/**
 * getOrderPartyActivity
 *
 * Loads public activity counters for both order participants.
 *
 * @param input.buyerId - Buyer profile UUID.
 * @param input.sellerId - Seller profile UUID.
 * @returns Buyer and seller counters.
 * @calledBy order detail pages
 */
export async function getOrderPartyActivity(input: {
  buyerId: string;
  sellerId: string;
}) {
  const map = await getPublicActivityCountsByProfileIds([
    input.buyerId,
    input.sellerId,
  ]);
  return {
    buyer: map[input.buyerId] ?? EMPTY_ACTIVITY,
    seller: map[input.sellerId] ?? EMPTY_ACTIVITY,
  };
}
