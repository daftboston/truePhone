import type { ListingStatus, Prisma } from "@prisma/client";

import type { ListingReviewTab } from "@/features/listings/schemas/review";
import { prisma } from "@/lib/db";

const ACTIVE_QUEUE: ListingStatus[] = ["PENDING_REVIEW"];
const APPROVED_STATUSES: ListingStatus[] = ["PUBLISHED", "APPROVED"];
const REJECTED_STATUSES: ListingStatus[] = ["REJECTED"];
const REVIEW_HISTORY: ListingStatus[] = [
  "PENDING_REVIEW",
  "PUBLISHED",
  "APPROVED",
  "REJECTED",
];

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

export function reviewStatusLabel(listing: {
  status: string;
  reviewerId: string | null;
}) {
  if (listing.status === "PENDING_REVIEW") {
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

export function sellerDisplayName(seller: {
  fullName: string | null;
  username: string | null;
}) {
  if (seller.fullName) return seller.fullName;
  if (seller.username) return `@${seller.username}`;
  return "Vendedor";
}

export function isEditableReviewStatus(status: string) {
  return (
    status === "PENDING_REVIEW" ||
    status === "PUBLISHED" ||
    status === "APPROVED" ||
    status === "REJECTED"
  );
}
