/**
 * @file favorites.ts
 * @description Favorite listings queries for marketplace users.
 * @dependencies @/lib/db, @/lib/listings-marketplace
 */

import { prisma } from "@/lib/db";
import { publishedListingWhere } from "@/lib/listings-marketplace";

const favoriteListingInclude = {
  listing: {
    include: {
      iphoneModel: true,
      iphoneColor: true,
      iphoneStorage: true,
      seller: {
        select: {
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
        },
      },
      images: {
        where: { imageType: "gallery" as const },
        orderBy: { displayOrder: "asc" as const },
        take: 1,
      },
    },
  },
} as const;

/**
 * listFavoritesForUser
 *
 * Lists published listings favorited by a user, newest first.
 *
 * @param userId - Profile UUID of the favoriting user.
 * @returns Published listing payloads with card includes.
 * @calledBy Favorites page
 */
export async function listFavoritesForUser(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: {
      userId,
      listing: {
        is: publishedListingWhere,
      },
    },
    include: favoriteListingInclude,
    orderBy: { createdAt: "desc" },
  });

  return favorites.map((favorite) => favorite.listing);
}

/**
 * isListingFavorited
 *
 * Checks whether a user has favorited a listing.
 *
 * @param userId - Profile UUID.
 * @param listingId - Listing UUID.
 * @returns True when a Favorite row exists.
 * @calledBy Listing detail favorite toggle
 */
export async function isListingFavorited(userId: string, listingId: string) {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_listingId: { userId, listingId },
    },
    select: { id: true },
  });
  return Boolean(favorite);
}

/**
 * countFavoritesForListing
 *
 * Counts how many users favorited a listing.
 *
 * @param listingId - Listing UUID.
 * @returns Favorite count.
 * @calledBy Listing social proof UI
 */
export async function countFavoritesForListing(listingId: string) {
  return prisma.favorite.count({ where: { listingId } });
}
