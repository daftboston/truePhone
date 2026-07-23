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

export async function isListingFavorited(userId: string, listingId: string) {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_listingId: { userId, listingId },
    },
    select: { id: true },
  });
  return Boolean(favorite);
}

export async function countFavoritesForListing(listingId: string) {
  return prisma.favorite.count({ where: { listingId } });
}
