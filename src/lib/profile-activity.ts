/**
 * @file profile-activity.ts
 * @description Public listing and completed-purchase counters.
 * @dependencies @prisma/client, @/lib/db
 */

import { type ListingStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export type PublicActivityCounts = {
  total: number;
  active: number;
  bought: number;
};

const EMPTY_ACTIVITY: PublicActivityCounts = {
  total: 0,
  active: 0,
  bought: 0,
};

/**
 * summarizePublicActivity
 *
 * Applies locked public-count rules: drafts stay private; active is PUBLISHED;
 * bought is completed purchases as buyer.
 *
 * @param input.listingStatuses - Non-deleted listing statuses for the profile.
 * @param input.bought - Count of COMPLETED orders where the profile is buyer.
 * @returns Total / active / bought counters.
 * @calledBy profile-activity.test.ts
 */
export function summarizePublicActivity(input: {
  listingStatuses: ListingStatus[];
  bought: number;
}): PublicActivityCounts {
  return summarizePublicActivityFromGroups({
    groups: input.listingStatuses.map((status) => ({ status, count: 1 })),
    bought: input.bought,
  });
}

/**
 * summarizePublicActivityFromGroups
 *
 * Same rules as summarizePublicActivity, using grouped listing counts from Prisma.
 *
 * @param input.groups - Status → count for non-deleted listings.
 * @param input.bought - Count of COMPLETED orders where the profile is buyer.
 * @returns Total / active / bought counters.
 * @calledBy getPublicActivityCounts, summarizePublicActivity
 */
export function summarizePublicActivityFromGroups(input: {
  groups: { status: ListingStatus; count: number }[];
  bought: number;
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
 * getPublicActivityCounts
 *
 * Loads listing status groups and completed-as-buyer orders.
 *
 * @param profileId - Profile UUID.
 * @returns Public total, active, and bought counters.
 * @calledBy profile pages, getPublicActivityCountsByProfileIds
 */
export async function getPublicActivityCounts(profileId: string) {
  const [groups, bought] = await Promise.all([
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
  ]);

  return summarizePublicActivityFromGroups({
    groups: groups.map((group) => ({
      status: group.status,
      count: group._count._all,
    })),
    bought,
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
