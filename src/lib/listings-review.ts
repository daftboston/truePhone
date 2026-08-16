/**
 * @file listings-review.ts
 * @description Reviewer queue queries and labels for listing moderation.
 * @dependencies @prisma/client, @/features/listings/schemas/review, @/lib/db
 */

import type { ListingStatus, Prisma } from "@prisma/client";

import type { ListingReviewTab } from "@/features/listings/schemas/review";
import { prisma } from "@/lib/db";

// SUBMITTED is a brief hop before PENDING_REVIEW. Include it so a
// resubmitted listing never disappears from the reviewer hub/queue.
const ACTIVE_QUEUE: ListingStatus[] = ["SUBMITTED", "PENDING_REVIEW"];
const APPROVED_STATUSES: ListingStatus[] = ["PUBLISHED", "APPROVED"];
const REJECTED_STATUSES: ListingStatus[] = ["REJECTED"];
const REVIEW_HISTORY: ListingStatus[] = [
  "SUBMITTED",
  "PENDING_REVIEW",
  "PUBLISHED",
  "APPROVED",
  "REJECTED",
];

/**
 * queueWhere
 *
 * Builds Prisma where clause for a reviewer queue tab.
 *
 * @param tab - ListingReviewTab value.
 * @returns Prisma.ListingWhereInput.
 */
function queueWhere(tab: ListingReviewTab): Prisma.ListingWhereInput {
  const base: Prisma.ListingWhereInput = { deletedAt: null };

  switch (tab) {
    case "pendiente":
      return { ...base, status: { in: ACTIVE_QUEUE }, reviewerId: null };
    case "en_revision":
      return {
        ...base,
        status: { in: ACTIVE_QUEUE },
        reviewerId: { not: null },
      };
    case "aprobados":
      return { ...base, status: { in: APPROVED_STATUSES } };
    case "rechazados":
      return { ...base, status: { in: REJECTED_STATUSES } };
    case "todos":
    default:
      return { ...base, status: { in: REVIEW_HISTORY } };
  }
}

/**
 * orderForTab
 *
 * Order-by clause for a reviewer queue tab.
 *
 * @param tab - ListingReviewTab value.
 * @returns Prisma orderBy input.
 */
function orderForTab(
  tab: ListingReviewTab,
): Prisma.ListingOrderByWithRelationInput {
  if (tab === "aprobados" || tab === "rechazados") {
    return { reviewedAt: "desc" };
  }
  if (tab === "todos") {
    return { updatedAt: "desc" };
  }
  return { updatedAt: "asc" };
}

/**
 * parseListingReviewTab
 *
 * Parses a query string into a ListingReviewTab, defaulting to pendiente.
 *
 * @param value - Raw tab query param.
 * @returns Valid ListingReviewTab.
 * @calledBy Reviewer listings page
 */
export function parseListingReviewTab(
  value: string | undefined,
): ListingReviewTab {
  if (
    value === "pendiente" ||
    value === "en_revision" ||
    value === "aprobados" ||
    value === "rechazados" ||
    value === "todos"
  ) {
    return value;
  }
  return "pendiente";
}

/**
 * reviewStatusLabel
 *
 * Spanish status label for a listing in the review queue.
 *
 * @param listing - Listing status and reviewerId fields.
 * @returns Localized status string.
 * @calledBy Reviewer queue UI
 */
export function reviewStatusLabel(listing: {
  status: string;
  reviewerId: string | null;
}) {
  if (listing.status === "PENDING_REVIEW" || listing.status === "SUBMITTED") {
    return listing.reviewerId ? "En revisión" : "Pendiente";
  }
  if (listing.status === "PUBLISHED" || listing.status === "APPROVED") {
    return "Aprobado";
  }
  if (listing.status === "REJECTED") {
    return "Rechazado";
  }
  return listing.status;
}

/**
 * reviewQueueTabForListing
 *
 * Maps a listing to the reviewer queue tab it belongs in.
 *
 * @param listing - Status and assigned reviewer.
 * @returns Queue tab id, or null when the listing is not in review history.
 * @calledBy listings-review tests
 */
export function reviewQueueTabForListing(listing: {
  status: string;
  reviewerId: string | null;
}): ListingReviewTab | null {
  if (listing.status === "SUBMITTED" || listing.status === "PENDING_REVIEW") {
    return listing.reviewerId ? "en_revision" : "pendiente";
  }
  if (listing.status === "PUBLISHED" || listing.status === "APPROVED") {
    return "aprobados";
  }
  if (listing.status === "REJECTED") {
    return "rechazados";
  }
  return null;
}

/**
 * listListingsForReview
 *
 * Lists listings for a reviewer tab with seller and image includes.
 *
 * @param tab - Queue tab.
 * @returns Listing rows for the queue.
 * @calledBy Reviewer listings page
 */
export async function listListingsForReview(tab: ListingReviewTab) {
  return prisma.listing.findMany({
    where: queueWhere(tab),
    include: {
      seller: {
        select: {
          id: true,
          fullName: true,
          username: true,
          city: true,
          verifikStatus: true,
        },
      },
      iphoneModel: true,
      iphoneColor: true,
      iphoneStorage: true,
      images: {
        where: { imageType: "gallery" },
        orderBy: { displayOrder: "asc" },
        take: 1,
      },
      reviewer: {
        select: { id: true, fullName: true, username: true },
      },
    },
    orderBy: orderForTab(tab),
  });
}

/**
 * countListingsForReview
 *
 * Counts listings per reviewer tab for badges.
 *
 * @returns Counts keyed by tab.
 * @calledBy Reviewer nav badges
 */
export async function countListingsForReview() {
  const [todos, pendiente, enRevision, aprobados, rechazados] =
    await Promise.all([
      prisma.listing.count({ where: queueWhere("todos") }),
      prisma.listing.count({ where: queueWhere("pendiente") }),
      prisma.listing.count({ where: queueWhere("en_revision") }),
      prisma.listing.count({ where: queueWhere("aprobados") }),
      prisma.listing.count({ where: queueWhere("rechazados") }),
    ]);
  return { todos, pendiente, enRevision, aprobados, rechazados };
}

/**
 * getListingForReview
 *
 * Loads a single listing for the reviewer detail view.
 *
 * @param listingId - Listing UUID.
 * @returns Listing with full review includes or null.
 * @calledBy Reviewer listing detail page
 */
export async function getListingForReview(listingId: string) {
  return prisma.listing.findFirst({
    where: {
      id: listingId,
      deletedAt: null,
      status: { in: REVIEW_HISTORY },
    },
    include: {
      seller: {
        select: {
          id: true,
          fullName: true,
          username: true,
          city: true,
          department: true,
          verifikStatus: true,
          sellerRating: true,
          totalSales: true,
        },
      },
      iphoneModel: true,
      iphoneColor: true,
      iphoneStorage: true,
      images: { orderBy: { displayOrder: "asc" } },
      possessionChallenge: true,
      reviewer: {
        select: { id: true, fullName: true, username: true },
      },
    },
  });
}

/**
 * findPossibleDuplicateListings
 *
 * Finds other seller listings that may duplicate the reviewed one.
 *
 * @param listing - Listing fields used for similarity matching.
 * @returns Candidate duplicate listings.
 * @calledBy Reviewer detail duplicate panel
 */
export async function findPossibleDuplicateListings(listing: {
  id: string;
  sellerId: string;
  iphoneModelId: string;
  imeiHash: string | null;
}) {
  const or: Prisma.ListingWhereInput[] = [
    {
      sellerId: listing.sellerId,
      iphoneModelId: listing.iphoneModelId,
      status: {
        in: ["PENDING_REVIEW", "APPROVED", "PUBLISHED", "RESERVED"],
      },
    },
  ];

  if (listing.imeiHash) {
    or.push({ imeiHash: listing.imeiHash });
  }

  return prisma.listing.findMany({
    where: {
      id: { not: listing.id },
      deletedAt: null,
      OR: or,
    },
    select: {
      id: true,
      title: true,
      status: true,
      imeiLast4: true,
      sellerId: true,
    },
    take: 8,
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * sellerDisplayName
 *
 * Resolves a seller display name for review UI.
 *
 * @param seller - Profile name fields.
 * @returns Display string.
 * @calledBy Reviewer queue cards
 */
export function sellerDisplayName(seller: {
  fullName: string | null;
  username: string | null;
}) {
  if (seller.fullName) return seller.fullName;
  if (seller.username) return `@${seller.username}`;
  return "Vendedor";
}

/**
 * isEditableReviewStatus
 *
 * Whether a listing status still allows reviewer decisions.
 *
 * @param status - Listing status string.
 * @returns True when pending review.
 * @calledBy Reviewer action guards
 */
export function isEditableReviewStatus(status: string) {
  return (
    status === "SUBMITTED" ||
    status === "PENDING_REVIEW" ||
    status === "PUBLISHED" ||
    status === "APPROVED" ||
    status === "REJECTED"
  );
}
