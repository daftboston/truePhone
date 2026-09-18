/**
 * @file page.tsx
 * @description Home page: hero, trust strip, featured listing grid, and footer.
 * @dependencies AppShell, HomeHero, HomeTrustStrip, ListingCard, listings marketplace helpers
 */

import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { HomeHero } from "@/components/home-hero";
import { HomeTrustStrip } from "@/components/home-trust-strip";
import { ListingCard } from "@/components/listing-card";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { RecentlyViewedSection } from "@/features/listings/components/recently-viewed-section";
import {
  HomeLandingPreference,
  LandingPreferenceRecorder,
} from "@/features/listings/components/landing-preference-sync";
import { conditionLabels } from "@/features/listings/schemas/listing";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  listFeaturedListings,
  primaryGalleryUrl,
  publicListingPath,
} from "@/lib/listings-marketplace";

/** Featured listings are live DB data; skip build-time prerender (CI has no Postgres). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TruePhone",
  description:
    "Compra y vende iPhones usados en Colombia. Cada anuncio es revisado manualmente antes de publicarse.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * HomePage
 *
 * Loads featured listings and composes the public marketing home experience.
 *
 * @returns Home shell with hero, trust strip, and featured grid or empty state.
 */
export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const explicitHome = params.ref === "inicio";
  const [featured, session] = await Promise.all([
    listFeaturedListings(4),
    getCurrentProfile(),
  ]);
  const signedInPreference = session?.profile.landingPreference ?? null;

  return (
    <>
      <HomeLandingPreference
        signedInPreference={signedInPreference}
        isAuthenticated={Boolean(session)}
        explicitHome={explicitHome}
      />
      <AppShell className="pb-0" mainClassName="gap-8 md:gap-10">
        <HomeHero />

        <HomeTrustStrip />

        {featured.length === 0 ? (
          <EmptyState
            title="Aún no hay anuncios publicados"
            description="Cuando un revisor apruebe un iPhone, aparecerá aquí."
            action={
              <Button asChild variant="outline">
                <Link href="/explorar">Explorar modelos</Link>
              </Button>
            }
            secondaryAction={
              <Button asChild variant="ghost" size="sm">
                <Link href="/ayuda">Preguntas frecuentes</Link>
              </Button>
            }
          />
        ) : (
          <section className="space-y-4" aria-labelledby="destacados-heading">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="destacados-heading"
                className="text-foreground text-lg font-semibold tracking-tight md:text-2xl"
              >
                Destacados
              </h2>
              <Link
                href="/explorar"
                className="text-muted-foreground hover:text-foreground text-sm underline-offset-2 hover:underline"
              >
                Ver catálogo
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {featured.map((listing) => (
                <ListingCard
                  key={listing.id}
                  href={publicListingPath(listing.slug)}
                  title={listing.title}
                  imageUrl={primaryGalleryUrl(listing)}
                  price={listing.finalPrice ?? listing.price}
                  batteryHealth={listing.batteryHealth ?? undefined}
                  verified
                  conditionLabel={conditionLabels[listing.condition]}
                />
              ))}
            </div>
          </section>
        )}

        <RecentlyViewedSection />
      </AppShell>
      <SiteFooter />
    </>
  );
}
