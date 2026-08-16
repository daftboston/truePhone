"use server";

/**
 * @file favorites.ts
 * @description Server actions for listings (favorites.ts).
 * @dependencies next/cache, @/lib/auth/session, @/lib/db, @/lib/listings-marketplace
 */

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { publishedListingWhere } from "@/lib/listings-marketplace";

export type FavoriteActionResult =
  | { ok: true; favorited: boolean }
  | { ok: false; error: string; loginRequired?: boolean };

/**
 * toggleFavoriteAction
 *
 * Server action: toggle favorite for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
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

/**
 * revalidateFavoritePaths
 *
 * Revalidates Next.js paths after listings mutations.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
function revalidateFavoritePaths(slug: string) {
  revalidatePath("/favoritos");
  revalidatePath(`/anuncios/${slug}`);
  revalidatePath("/");
}
