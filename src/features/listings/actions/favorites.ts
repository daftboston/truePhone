"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { publishedListingWhere } from "@/lib/listings-marketplace";

export type FavoriteActionResult =
  | { ok: true; favorited: boolean }
  | { ok: false; error: string; loginRequired?: boolean };

export async function toggleFavoriteAction(
  listingId: string,
): Promise<FavoriteActionResult> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión para guardar favoritos.",
      loginRequired: true,
    };
  }

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, ...publishedListingWhere },
    select: { id: true, slug: true },
  });

  if (!listing) {
    return { ok: false, error: "Este anuncio no está disponible." };
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_listingId: {
        userId: current.profile.id,
        listingId: listing.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidateFavoritePaths(listing.slug);
    return { ok: true, favorited: false };
  }

  await prisma.favorite.create({
    data: {
      userId: current.profile.id,
      listingId: listing.id,
    },
  });
  revalidateFavoritePaths(listing.slug);
  return { ok: true, favorited: true };
}

function revalidateFavoritePaths(slug: string) {
  revalidatePath("/favoritos");
  revalidatePath(`/anuncios/${slug}`);
  revalidatePath("/");
}
