import type { Condition, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

/** Public marketplace only shows published, non-deleted listings. */
export const publishedListingWhere: Prisma.ListingWhereInput = {
  status: "PUBLISHED",
  deletedAt: null,
};

const sellerCardSelect = {
  id: true,
  fullName: true,
  username: true,
  avatarUrl: true,
  city: true,
  department: true,
  sellerRating: true,
  totalSales: true,
  totalReviews: true,
  isTrustedSeller: true,
  verifikStatus: true,
} satisfies Prisma.ProfileSelect;

const listingCardInclude = {
  iphoneModel: true,
  iphoneColor: true,
  iphoneStorage: true,
  seller: { select: sellerCardSelect },
  images: {
    where: { imageType: "gallery" },
    orderBy: { displayOrder: "asc" as const },
    take: 1,
  },
} satisfies Prisma.ListingInclude;

const listingDetailInclude = {
  iphoneModel: true,
  iphoneColor: true,
  iphoneStorage: true,
  seller: { select: sellerCardSelect },
  images: {
    orderBy: { displayOrder: "asc" as const },
  },
} satisfies Prisma.ListingInclude;

export type PublishedListingCard = Prisma.ListingGetPayload<{
  include: typeof listingCardInclude;
}>;

export type PublishedListingDetail = Prisma.ListingGetPayload<{
  include: typeof listingDetailInclude;
}>;

export type ListPublishedOptions = {
  take?: number;
  skip?: number;
  /** Default: newest published first (`approvedAt` then `createdAt`). */
  orderBy?: "newest" | "price_asc" | "price_desc";
  q?: string;
  modelId?: string;
  /** Restrict to several models (e.g. a whole generation series). */
  modelIds?: string[];
  storageId?: string;
  condition?: Condition;
  minPrice?: number;
  maxPrice?: number;
};

function orderByClause(
  orderBy: ListPublishedOptions["orderBy"] = "newest",
): Prisma.ListingOrderByWithRelationInput[] {
  switch (orderBy) {
    case "price_asc":
      return [{ price: "asc" }, { approvedAt: "desc" }];
    case "price_desc":
      return [{ price: "desc" }, { approvedAt: "desc" }];
    case "newest":
    default:
      return [{ approvedAt: "desc" }, { createdAt: "desc" }];
  }
}

function buildPublishedWhere(
  options: ListPublishedOptions = {},
): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = { ...publishedListingWhere };
  const and: Prisma.ListingWhereInput[] = [];

  if (options.modelId) {
    and.push({ iphoneModelId: options.modelId });
  } else if (options.modelIds && options.modelIds.length > 0) {
    and.push({ iphoneModelId: { in: options.modelIds } });
  }
  if (options.storageId) {
    and.push({ iphoneStorageId: options.storageId });
  }
  if (options.condition) {
    and.push({ condition: options.condition });
  }
  if (options.minPrice != null || options.maxPrice != null) {
    and.push({
      price: {
        ...(options.minPrice != null ? { gte: options.minPrice } : {}),
        ...(options.maxPrice != null ? { lte: options.maxPrice } : {}),
      },
    });
  }

  const q = options.q?.trim();
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { iphoneModel: { name: { contains: q, mode: "insensitive" } } },
        { iphoneColor: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

/** Featured strip for home — newest published listings. */
export async function listFeaturedListings(limit = 8) {
  return prisma.listing.findMany({
    where: publishedListingWhere,
    include: listingCardInclude,
    orderBy: orderByClause("newest"),
    take: limit,
  });
}

/** Paginated browse list with optional search/filters. */
export async function listPublishedListings(
  options: ListPublishedOptions = {},
) {
  const take = options.take ?? 24;
  const skip = options.skip ?? 0;
  const where = buildPublishedWhere(options);

  return prisma.listing.findMany({
    where,
    include: listingCardInclude,
    orderBy: orderByClause(options.orderBy),
    take,
    skip,
  });
}

export async function countPublishedListings(
  options: ListPublishedOptions = {},
) {
  return prisma.listing.count({ where: buildPublishedWhere(options) });
}

/**
 * Public listing detail by slug.
 * When `incrementViews` is true, bumps view count after a successful load.
 */
export async function getPublishedListingBySlug(
  slug: string,
  options?: { incrementViews?: boolean },
) {
  const listing = await prisma.listing.findFirst({
    where: {
      ...publishedListingWhere,
      slug,
    },
    include: listingDetailInclude,
  });

  if (!listing) return null;

  if (options?.incrementViews) {
    await prisma.listing.update({
      where: { id: listing.id },
      data: { views: { increment: 1 } },
    });
    return { ...listing, views: listing.views + 1 };
  }

  return listing;
}

/** Same-model published listings for the detail “related” strip. */
export async function listRelatedPublishedListings(
  listing: { id: string; iphoneModelId: string },
  limit = 4,
) {
  return prisma.listing.findMany({
    where: {
      ...publishedListingWhere,
      iphoneModelId: listing.iphoneModelId,
      id: { not: listing.id },
    },
    include: listingCardInclude,
    orderBy: orderByClause("newest"),
    take: limit,
  });
}

export function publicListingPath(slug: string) {
  return `/anuncios/${slug}`;
}

export function primaryGalleryUrl(listing: { images: { imageUrl: string }[] }) {
  return listing.images[0]?.imageUrl;
}

export function marketplaceSellerName(seller: {
  fullName: string | null;
  username: string | null;
}) {
  if (seller.fullName) return seller.fullName;
  if (seller.username) return `@${seller.username}`;
  return "Vendedor";
}
