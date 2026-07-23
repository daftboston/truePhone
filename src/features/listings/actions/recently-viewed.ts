"use server";

import type { Condition } from "@prisma/client";

import { isSellerIdentityVerified } from "@/features/verification/types";
import { prisma } from "@/lib/db";
import {
  primaryGalleryUrl,
  publishedListingWhere,
} from "@/lib/listings-marketplace";

export async function getRecentlyViewedListingsAction(slugs: string[]) {
  const unique = [...new Set(slugs.filter(Boolean))].slice(0, 8);
  if (unique.length === 0) {
    return { ok: true as const, listings: [] };
  }

  const listings = await prisma.listing.findMany({
    where: {
      ...publishedListingWhere,
      slug: { in: unique },
    },
    include: {
      seller: {
        select: {
          verifikStatus: true,
          isTrustedSeller: true,
        },
      },
      images: {
        where: { imageType: "gallery" },
        orderBy: { displayOrder: "asc" },
        take: 1,
      },
    },
  });

  const bySlug = new Map(listings.map((listing) => [listing.slug, listing]));
  const ordered = unique
    .map((slug) => bySlug.get(slug))
    .filter((listing): listing is NonNullable<typeof listing> =>
      Boolean(listing),
    );

  return {
    ok: true as const,
    listings: ordered.map((listing) => ({
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      price: listing.price,
      finalPrice: listing.finalPrice,
      batteryHealth: listing.batteryHealth,
      condition: listing.condition as Condition,
      imageUrl: primaryGalleryUrl(listing),
      verified:
        isSellerIdentityVerified(listing.seller.verifikStatus) ||
        listing.seller.isTrustedSeller,
    })),
  };
}
