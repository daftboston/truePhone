import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import {
  HomeFeaturedRotator,
  type FeaturedListingSlide,
} from "@/components/home-featured-rotator";
import { HomeHero } from "@/components/home-hero";
import { HomeTrustStrip } from "@/components/home-trust-strip";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { conditionLabels } from "@/features/listings/schemas/listing";
import { isSellerIdentityVerified } from "@/features/verification/types";
import {
  listFeaturedListings,
  marketplaceSellerName,
  primaryGalleryUrl,
  publicListingPath,
} from "@/lib/listings-marketplace";

export const metadata: Metadata = {
  title: "TruePhone",
  description:
    "El marketplace más confiable para comprar y vender iPhones usados en Colombia. Cada anuncio es revisado manualmente.",
};

export default async function HomePage() {
  const featured = await listFeaturedListings(4);

  const slides: FeaturedListingSlide[] = featured.map((listing) => ({
    id: listing.id,
    href: publicListingPath(listing.slug),
    title: listing.title,
    imageUrl: primaryGalleryUrl(listing),
    price: listing.finalPrice ?? listing.price,
    equipmentPrice: listing.price,
    protectionFee: listing.platformFee ?? undefined,
    conditionLabel: conditionLabels[listing.condition],
    sellerName: marketplaceSellerName(listing.seller),
    sellerAvatarUrl: listing.seller.avatarUrl ?? undefined,
    sellerVerified:
      isSellerIdentityVerified(listing.seller.verifikStatus) ||
      listing.seller.isTrustedSeller,
    sellerSubtitle: listing.seller.city
      ? `Vendedor en ${listing.seller.city}`
      : undefined,
  }));

  return (
    <>
      <AppShell className="pb-0" mainClassName="gap-8 md:gap-10">
        <HomeHero />

        <HomeTrustStrip />

        {slides.length === 0 ? (
          <EmptyState
            title="Aún no hay anuncios publicados"
            description="Cuando un revisor apruebe un iPhone, aparecerá aquí."
            action={
              <Button asChild variant="outline">
                <Link href="/explorar">Explorar modelos</Link>
              </Button>
            }
          />
        ) : (
          <HomeFeaturedRotator listings={slides} />
        )}
      </AppShell>
      <SiteFooter />
    </>
  );
}
