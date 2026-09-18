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
  /** Default: newest published first (`publishedAt`, then `approvedAt`, then `id`). */
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

/** Opaque cursor for keyset pagination on (publishedAt, id). */
export type PublishedListingCursor = {
  publishedAt: string;
  id: string;
};

export type ListPublishedCursorOptions = Omit<
  ListPublishedOptions,
  "skip" | "orderBy"
> & {
  take?: number;
  /** Fetch rows strictly older than this cursor (DESC feed). */
  cursor?: PublishedListingCursor | null;
  /** Fetch the previous page (rows strictly newer than this cursor). */
  before?: PublishedListingCursor | null;
};

export type PublishedListingCursorPage = {
  listings: PublishedListingCard[];
  nextCursor: PublishedListingCursor | null;
  prevCursor: PublishedListingCursor | null;
  hasMore: boolean;
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
      return [{ price: "asc" }, { publishedAt: "desc" }, { id: "desc" }];
    case "price_desc":
      return [{ price: "desc" }, { publishedAt: "desc" }, { id: "desc" }];
    case "newest":
    default:
      return [{ publishedAt: "desc" }, { approvedAt: "desc" }, { id: "desc" }];
  }
}

/**
 * effectivePublishedAt
 *
 * Resolves the sort timestamp used for cursor pagination.
 *
 * @param listing - Row with publish timestamps.
 * @returns ISO string for cursor encoding.
 */
function effectivePublishedAt(listing: {
  publishedAt: Date | null;
  approvedAt: Date | null;
}) {
  return (
    listing.publishedAt ??
    listing.approvedAt ??
    new Date(0)
  ).toISOString();
}

/**
 * listingCursorFromRow
 *
 * Builds a cursor token from a listing card row.
 *
 * @param listing - Listing row with id and publish timestamps.
 * @returns Cursor for keyset pagination.
 */
export function listingCursorFromRow(listing: {
  id: string;
  publishedAt: Date | null;
  approvedAt: Date | null;
}): PublishedListingCursor {
  return {
    publishedAt: effectivePublishedAt(listing),
    id: listing.id,
  };
}

/**
 * encodePublishedListingCursor
 *
 * Serializes a cursor for URL query params.
 *
 * @param cursor - Parsed cursor object.
 * @returns Base64url-encoded cursor string.
 */
export function encodePublishedListingCursor(cursor: PublishedListingCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

/**
 * decodePublishedListingCursor
 *
 * Parses a cursor query param back into a cursor object.
 *
 * @param value - Raw cursor query param.
 * @returns Parsed cursor or null when invalid.
 */
export function decodePublishedListingCursor(
  value: string | undefined,
): PublishedListingCursor | null {
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as PublishedListingCursor;
    if (
      typeof parsed.publishedAt === "string" &&
      typeof parsed.id === "string" &&
      parsed.id.length > 0
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * cursorBeforeWhere
 *
 * Builds a Prisma filter for rows strictly older than a DESC cursor.
 *
 * @param cursor - End cursor from the previous page.
 * @returns Prisma where fragment.
 */
function cursorBeforeWhere(
  cursor: PublishedListingCursor,
): Prisma.ListingWhereInput {
  const publishedAt = new Date(cursor.publishedAt);
  return {
    OR: [
      { publishedAt: { lt: publishedAt } },
      {
        publishedAt,
        id: { lt: cursor.id },
      },
      {
        publishedAt: null,
        approvedAt: { lt: publishedAt },
      },
      {
        publishedAt: null,
        approvedAt: publishedAt,
        id: { lt: cursor.id },
      },
    ],
  };
}

/**
 * cursorAfterWhere
 *
 * Builds a Prisma filter for rows strictly newer than a DESC cursor.
 *
 * @param cursor - Start cursor from the current page.
 * @returns Prisma where fragment.
 */
function cursorAfterWhere(
  cursor: PublishedListingCursor,
): Prisma.ListingWhereInput {
  const publishedAt = new Date(cursor.publishedAt);
  return {
    OR: [
      { publishedAt: { gt: publishedAt } },
      {
        publishedAt,
        id: { gt: cursor.id },
      },
      {
        publishedAt: null,
        approvedAt: { gt: publishedAt },
      },
      {
        publishedAt: null,
        approvedAt: publishedAt,
        id: { gt: cursor.id },
      },
    ],
  };
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
  const now = new Date();
  const boosted = await prisma.listing.findMany({
    where: {
      ...publishedListingWhere,
      boostUntil: { gt: now },
    },
    include: listingCardInclude,
    orderBy: [{ boostUntil: "desc" }, { approvedAt: "desc" }],
    take: limit,
  });

  if (boosted.length >= limit) {
    return boosted.slice(0, limit);
  }

  const boostedIds = boosted.map((row) => row.id);
  const rest = await prisma.listing.findMany({
    where: {
      ...publishedListingWhere,
      id: boostedIds.length > 0 ? { notIn: boostedIds } : undefined,
    },
    include: listingCardInclude,
    orderBy: orderByClause("newest"),
    take: limit - boosted.length,
  });

  return [...boosted, ...rest];
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
 * listPublishedListingsByCursor
 *
 * Keyset-paginates published listings newest-first on (publishedAt, id).
 * Does not apply boost/Destacados ordering.
 *
 * @param options - Filters plus optional cursor/before tokens.
 * @returns One page of cards and next/prev cursors.
 * @calledBy `/anuncios` feed
 */
export async function listPublishedListingsByCursor(
  options: ListPublishedCursorOptions = {},
): Promise<PublishedListingCursorPage> {
  const take = options.take ?? 12;
  const filterAnd: Prisma.ListingWhereInput[] = [];
  const baseWhere = buildPublishedWhere(options);
  if (baseWhere.AND) {
    const clauses = Array.isArray(baseWhere.AND)
      ? baseWhere.AND
      : [baseWhere.AND];
    filterAnd.push(...clauses);
  }

  const orderByNewest: Prisma.ListingOrderByWithRelationInput[] = [
    { publishedAt: "desc" },
    { approvedAt: "desc" },
    { id: "desc" },
  ];

  if (options.before) {
    filterAnd.push(cursorAfterWhere(options.before));
    const rows = await prisma.listing.findMany({
      where: { ...publishedListingWhere, AND: filterAnd },
      include: listingCardInclude,
      orderBy: [{ publishedAt: "asc" }, { approvedAt: "asc" }, { id: "asc" }],
      take: take + 1,
    });
    const hasPrevPage = rows.length > take;
    const slice = hasPrevPage ? rows.slice(0, take) : rows;
    const listings = [...slice].reverse();
    const first = listings[0] ?? null;
    const last = listings[listings.length - 1] ?? null;

    return {
      listings,
      nextCursor: last ? listingCursorFromRow(last) : null,
      prevCursor: hasPrevPage && first ? listingCursorFromRow(first) : null,
      hasMore: Boolean(last),
    };
  }

  if (options.cursor) {
    filterAnd.push(cursorBeforeWhere(options.cursor));
  }

  const rows = await prisma.listing.findMany({
    where: { ...publishedListingWhere, AND: filterAnd },
    include: listingCardInclude,
    orderBy: orderByNewest,
    take: take + 1,
  });
  const hasMore = rows.length > take;
  const listings = hasMore ? rows.slice(0, take) : rows;
  const first = listings[0] ?? null;
  const last = listings[listings.length - 1] ?? null;

  return {
    listings,
    nextCursor: hasMore && last ? listingCursorFromRow(last) : null,
    prevCursor: options.cursor && first ? listingCursorFromRow(first) : null,
    hasMore,
  };
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

export type PublishedStockByModel = {
  count: number;
  minBuyerPrice: number | null;
};

/**
 * listPublishedStockByModel
 *
 * Groups published listings by catalog model and returns count plus the
 * lowest buyer-facing price (finalPrice, then price).
 *
 * @returns Map of iphoneModelId to stock summary.
 * @calledBy ExplorePage
 */
export async function listPublishedStockByModel() {
  const rows = await prisma.listing.groupBy({
    by: ["iphoneModelId"],
    where: publishedListingWhere,
    _count: { _all: true },
    _min: { finalPrice: true, price: true },
  });

  const stock = new Map<string, PublishedStockByModel>();
  for (const row of rows) {
    stock.set(row.iphoneModelId, {
      count: row._count._all,
      minBuyerPrice: row._min.finalPrice ?? row._min.price,
    });
  }
  return stock;
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
