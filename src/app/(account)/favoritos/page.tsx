/**
 * @file page.tsx
 * @description Authenticated favorites/wishlist of marketplace listings.
 * @dependencies Favorites loaders and ListingCard
 */

import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { conditionLabels } from "@/features/listings/schemas/listing";
import { isSellerIdentityVerified } from "@/features/verification/types";
import { requireCurrentProfile } from "@/lib/auth/session";
import { listFavoritesForUser } from "@/lib/favorites";
import {
  primaryGalleryUrl,
  publicListingPath,
} from "@/lib/listings-marketplace";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Tus iPhones guardados en TruePhone.",
};

/**
 * FavoritesPage
 *
 * Lists listings the current user has favorited.
 *
 * @returns Favorites grid or empty state.
 */
export default async function FavoritesPage() {
  const current = await requireCurrentProfile("/favoritos");
  const listings = await listFavoritesForUser(current.profile.id);

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Favoritos
        </h1>
        <p className="text-muted-foreground text-sm">
          Anuncios que guardaste para ver después.
        </p>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="Aún no has guardado ningún dispositivo"
          description="Cuando veas un iPhone que te guste, tócalo en Guardar."
          action={
            <Button asChild>
              <Link href="/explorar">Explorar iPhones</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              href={publicListingPath(listing.slug)}
              title={listing.title}
              imageUrl={primaryGalleryUrl(listing)}
              price={listing.finalPrice ?? listing.price}
              batteryHealth={listing.batteryHealth ?? undefined}
              conditionLabel={conditionLabels[listing.condition]}
              verified={
                isSellerIdentityVerified(listing.seller.verifikStatus) ||
                listing.seller.isTrustedSeller
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
