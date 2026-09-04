/**
 * @file listings-marketplace.ts
 * @description Public marketplace listing queries, filters, and display helpers.
 * @dependencies @prisma/client, @/lib/db
 */

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
  /** Restrict to one seller's shop (public profile). */
  sellerId?: string;
};

/**
 * orderByClause
 *
 * Maps marketplace sort options to Prisma orderBy arrays.
 *
 * @param orderBy - newest | price_asc | price_desc.
 * @returns Prisma orderBy list.
 */
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

/**
 * buildPublishedWhere
 *
 * Builds the published-listing filter including search and facet options.
 *
 * @param options - ListPublishedOptions filters.
 * @returns Prisma.ListingWhereInput.
 */
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
  if (options.sellerId) {
    and.push({ sellerId: options.sellerId });
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

/**
 * listFeaturedListings
 *
 * Returns a small set of newest published listings for home/feature slots.
 *
 * @param limit - Max rows; defaults to 8.
 * @returns Published listing cards.
 * @calledBy Home page featured section
 */
export async function listFeaturedListings(limit = 8) {
  return prisma.listing.findMany({
    where: publishedListingWhere,
    include: listingCardInclude,
    orderBy: orderByClause("newest"),
    take: limit,
  });
}

/**
 * listPublishedListings
 *
 * Lists published listings with pagination and marketplace filters.
 *
 * @param options - take, skip, orderBy, q, model/storage/condition/price filters.
 * @returns Published listing cards.
 * @calledBy Browse/search pages
 */
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

/**
 * countPublishedListings
 *
 * Counts published listings matching marketplace filters.
 *
 * @param options - Same filters as listPublishedListings (without take/skip).
 * @returns Matching listing count.
 * @calledBy Browse pagination
 */
export async function countPublishedListings(
  options: ListPublishedOptions = {},
) {
  return prisma.listing.count({ where: buildPublishedWhere(options) });
}

/**
 * getPublishedListingBySlug
 *
 * Loads a published listing detail by public slug.
 *
 * @param slug - Listing slug.
 * @returns Published listing detail or null.
 * @calledBy Public listing detail page
 */
export async function getPublishedListingBySlug(slug: string) {
  return prisma.listing.findFirst({
    where: {
      ...publishedListingWhere,
      slug,
    },
    include: listingDetailInclude,
  });
}

/**
 * listRelatedPublishedListings
 *
 * Lists related published listings (same model, excluding current).
 *
 * @param listing - Current listing id/modelId.
 * @param take - Max related rows.
 * @returns Related listing cards.
 * @calledBy Listing detail related section
 */
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

/**
 * publicListingPath
 *
 * Builds the public listing URL path from a slug.
 *
 * @param slug - Listing slug.
 * @returns `/anuncios/{slug}` path.
 * @calledBy Marketplace links
 */
export function publicListingPath(slug: string) {
  return `/anuncios/${slug}`;
}

/**
 * primaryGalleryUrl
 *
 * Picks the first gallery image URL from a listing card payload.
 *
 * @param listing - Listing with images array.
 * @returns Image URL or null.
 * @calledBy Listing cards
 */
export function primaryGalleryUrl(listing: { images: { imageUrl: string }[] }) {
  return listing.images[0]?.imageUrl;
}

/**
 * marketplaceSellerName
 *
 * Resolves seller display name for marketplace cards.
 *
 * @param seller - Profile name fields.
 * @returns Display string.
 * @calledBy Listing cards and detail
 */
export function marketplaceSellerName(seller: {
  fullName: string | null;
  username: string | null;
}) {
  if (seller.fullName) return seller.fullName;
  if (seller.username) return `@${seller.username}`;
  return "Vendedor";
}
