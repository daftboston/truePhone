/**
 * @file ops-analytics.ts
 * @description Aggregates marketplace and queue metrics for the ops analytics page.
 * @dependencies @prisma/client, @/lib/db, queue count helpers
 */

import { prisma } from "@/lib/db";
import { countPendingIdentityVerifications } from "@/lib/auth/identity";
import { countOpenListingQuestionReports } from "@/lib/listing-qa";
import { countListingsForReview } from "@/lib/listings-review";
import { countActionableOrderSupportCases } from "@/lib/orders/order-support-service";
import { countOpsDisputeQueue } from "@/lib/payments/ops-disputes";
import { countAuthorizedPayouts } from "@/lib/payments/ops-payouts";
import { countOpenReviewReports } from "@/lib/reviews";

const TOP_N = 8;
const REVIEW_TIME_SAMPLE = 200;

export type OpsAnalyticsSnapshot = {
  listingStatusCounts: {
    published: number;
    reserved: number;
    sold: number;
    pendingReview: number;
    rejected: number;
  };
  settledGmvPesos: number;
  settledFeePesos: number;
  settledOrderCount: number;
  paidOrderCount: number;
  listingViewCount: number;
  viewsToCompletedPercent: number | null;
  approvalRatePercent: number | null;
  medianReviewHours: number | null;
  profilesLast7Days: number;
  profilesLast30Days: number;
  sellersLast30Days: number;
  queue: {
    listingsPending: number;
    listingsInReview: number;
    identityPending: number;
    payoutsAuthorized: number;
    disputesFrozen: number;
    questionReports: number;
    reviewReports: number;
    orderSupport: number;
  };
  topViewed: {
    id: string;
    slug: string;
    title: string;
    views: number;
    status: string;
  }[];
  popularPublishedModels: { name: string; count: number }[];
  popularSoldModels: { name: string; count: number }[];
};

/**
 * medianNumber
 *
 * Returns the median of a numeric sample, or null when empty.
 *
 * @param values - Unsorted numbers.
 * @returns Median, averaging the two middle values for even lengths.
 * @calledBy loadOpsAnalytics, ops-analytics.test.ts
 */
export function medianNumber(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

/**
 * approvalRatePercent
 *
 * Share of reviewed listings that were approved (published), rounded.
 *
 * @param approved - Published/approved queue count.
 * @param rejected - Rejected queue count.
 * @returns Percent 0–100, or null when nothing has been reviewed.
 * @calledBy loadOpsAnalytics, ops-analytics.test.ts
 */
export function approvalRatePercent(
  approved: number,
  rejected: number,
): number | null {
  const total = approved + rejected;
  if (total === 0) return null;
  return Math.round((approved / total) * 100);
}

/**
 * viewsToCompletedPercent
 *
 * Completed (settled) orders as a percent of unique listing views.
 *
 * @param views - Sum of Listing.views (unique visitor-days).
 * @param completed - Orders with payoutCompletedAt set.
 * @returns One-decimal percent, or null when there are no views.
 * @calledBy loadOpsAnalytics, ops-analytics.test.ts
 */
export function viewsToCompletedPercent(
  views: number,
  completed: number,
): number | null {
  if (views <= 0) return null;
  return Math.round((completed / views) * 1000) / 10;
}

/**
 * hoursBetween
 *
 * Elapsed hours between two timestamps.
 *
 * @param start - Earlier instant.
 * @param end - Later instant.
 * @returns Non-negative hours.
 * @calledBy loadOpsAnalytics, ops-analytics.test.ts
 */
export function hoursBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
}

/**
 * modelCountsFromGroups
 *
 * Joins Prisma groupBy rows to catalog names and keeps the top N.
 *
 * @param groups - iphoneModelId counts.
 * @param names - id → display name map.
 * @param take - Max rows to keep after sorting by count desc.
 * @returns Named count rows.
 * @calledBy loadOpsAnalytics, ops-analytics.test.ts
 */
export function modelCountsFromGroups(
  groups: { iphoneModelId: string; _count: { _all: number } }[],
  names: Map<string, string>,
  take = TOP_N,
): { name: string; count: number }[] {
  return groups
    .map((group) => ({
      name: names.get(group.iphoneModelId) ?? "Modelo",
      count: group._count._all,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, take);
}

/**
 * loadOpsAnalytics
 *
 * Loads one ops snapshot for `/revision/analitica`. Views are never meant
 * for public profiles or order party cards.
 *
 * @returns Aggregated marketplace, queue, and listing-view metrics.
 * @calledBy OpsAnalyticsPage
 */
export async function loadOpsAnalytics(): Promise<OpsAnalyticsSnapshot> {
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    published,
    reserved,
    sold,
    pendingReview,
    rejected,
    settledMoney,
    paidOrderCount,
    listingViewSum,
    listingCounts,
    identityPending,
    payoutsAuthorized,
    disputesFrozen,
    questionReports,
    reviewReports,
    orderSupport,
    profilesLast7Days,
    profilesLast30Days,
    sellersLast30Days,
    topViewedRows,
    publishedModelGroups,
    soldModelGroups,
    reviewDurations,
    catalogModels,
  ] = await Promise.all([
    prisma.listing.count({
      where: { deletedAt: null, status: "PUBLISHED" },
    }),
    prisma.listing.count({
      where: { deletedAt: null, status: "RESERVED" },
    }),
    prisma.listing.count({ where: { deletedAt: null, status: "SOLD" } }),
    prisma.listing.count({
      where: {
        deletedAt: null,
        status: { in: ["SUBMITTED", "PENDING_REVIEW"] },
      },
    }),
    prisma.listing.count({
      where: { deletedAt: null, status: "REJECTED" },
    }),
    prisma.order.aggregate({
      where: { payoutCompletedAt: { not: null } },
      _sum: { equipmentPrice: true, platformFee: true },
      _count: true,
    }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.listing.aggregate({
      where: { deletedAt: null },
      _sum: { views: true },
    }),
    countListingsForReview(),
    countPendingIdentityVerifications(),
    countAuthorizedPayouts(),
    countOpsDisputeQueue(),
    countOpenListingQuestionReports(),
    countOpenReviewReports(),
    countActionableOrderSupportCases(),
    prisma.profile.count({ where: { createdAt: { gte: since7 } } }),
    prisma.profile.count({ where: { createdAt: { gte: since30 } } }),
    prisma.listing.groupBy({
      by: ["sellerId"],
      where: { createdAt: { gte: since30 }, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.listing.findMany({
      where: { deletedAt: null, views: { gt: 0 } },
      orderBy: { views: "desc" },
      take: TOP_N,
      select: {
        id: true,
        slug: true,
        title: true,
        views: true,
        status: true,
      },
    }),
    prisma.listing.groupBy({
      by: ["iphoneModelId"],
      where: { deletedAt: null, status: "PUBLISHED" },
      _count: { _all: true },
    }),
    prisma.listing.groupBy({
      by: ["iphoneModelId"],
      where: {
        deletedAt: null,
        orders: { some: { payoutCompletedAt: { not: null } } },
      },
      _count: { _all: true },
    }),
    prisma.listing.findMany({
      where: { deletedAt: null, reviewedAt: { not: null } },
      orderBy: { reviewedAt: "desc" },
      take: REVIEW_TIME_SAMPLE,
      select: { createdAt: true, reviewedAt: true },
    }),
    prisma.iphoneModel.findMany({ select: { id: true, name: true } }),
  ]);

  const names = new Map(catalogModels.map((model) => [model.id, model.name]));
  const settledOrderCount = settledMoney._count;
  const listingViewCount = listingViewSum._sum.views ?? 0;
  const medianReviewHours = medianNumber(
    reviewDurations.flatMap((row) =>
      row.reviewedAt ? [hoursBetween(row.createdAt, row.reviewedAt)] : [],
    ),
  );

  return {
    listingStatusCounts: {
      published,
      reserved,
      sold,
      pendingReview,
      rejected,
    },
    settledGmvPesos: settledMoney._sum.equipmentPrice ?? 0,
    settledFeePesos: settledMoney._sum.platformFee ?? 0,
    settledOrderCount,
    paidOrderCount,
    listingViewCount,
    viewsToCompletedPercent: viewsToCompletedPercent(
      listingViewCount,
      settledOrderCount,
    ),
    approvalRatePercent: approvalRatePercent(
      listingCounts.aprobados,
      listingCounts.rechazados,
    ),
    medianReviewHours,
    profilesLast7Days,
    profilesLast30Days,
    sellersLast30Days: sellersLast30Days.length,
    queue: {
      listingsPending: listingCounts.pendiente,
      listingsInReview: listingCounts.enRevision,
      identityPending,
      payoutsAuthorized,
      disputesFrozen,
      questionReports,
      reviewReports,
      orderSupport,
    },
    topViewed: topViewedRows,
    popularPublishedModels: modelCountsFromGroups(publishedModelGroups, names),
    popularSoldModels: modelCountsFromGroups(soldModelGroups, names),
  };
}

/**
 * countListingViews
 *
 * Sums denormalized Listing.views for the review hub analytics card.
 *
 * @returns Total unique-visitor-day views across non-deleted listings.
 * @calledBy ReviewHubPage
 */
export async function countListingViews() {
  const sum = await prisma.listing.aggregate({
    where: { deletedAt: null },
    _sum: { views: true },
  });
  return sum._sum.views ?? 0;
}
