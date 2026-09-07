"use client";

/**
 * @file recently-viewed-section.tsx
 * @description RecentlyViewedSection component for the listings feature.tsx.
 * @dependencies next/link, react, @/components/listing-card, @/features/listings/actions/recently-viewed, @/lib/recently-viewed
 */

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ListingCard } from "@/components/listing-card";
import { ListingCardSkeleton } from "@/components/loading-skeleton";
import { getRecentlyViewedListingsAction } from "@/features/listings/actions/recently-viewed";
import { conditionLabels } from "@/features/listings/schemas/listing";
import { readRecentlyViewed } from "@/lib/recently-viewed";

type RecentCard = {
  id: string;
  slug: string;
  title: string;
  price: number;
  finalPrice: number | null;
  batteryHealth: number | null;
  condition: keyof typeof conditionLabels;
  imageUrl?: string;
  verified: boolean;
};

const EMPTY_SLUGS_JSON = "[]";

/**
 * subscribeRecentlyViewed
 *
 * No-op subscribe: recently-viewed is read once per mount from localStorage.
 *
 * @returns Unsubscribe function.
 * @calledBy useSyncExternalStore in RecentlyViewedSection
 */
function subscribeRecentlyViewed() {
  return () => {};
}

/**
 * getRecentlyViewedSlugsSnapshot
 *
 * Serializes up to four stored slugs so the snapshot is referentially stable.
 *
 * @returns JSON array of listing slugs.
 * @calledBy useSyncExternalStore in RecentlyViewedSection
 */
function getRecentlyViewedSlugsSnapshot() {
  return JSON.stringify(
    readRecentlyViewed()
      .map((item) => item.slug)
      .slice(0, 4),
  );
}

/**
 * getServerRecentlyViewedSnapshot
 *
 * Server render has no localStorage, so the section stays empty until hydrate.
 *
 * @returns Empty JSON array.
 * @calledBy useSyncExternalStore in RecentlyViewedSection
 */
function getServerRecentlyViewedSnapshot() {
  return EMPTY_SLUGS_JSON;
}

/**
 * RecentlyViewedSection
 *
 * Home-grid of recently viewed listings. Shows ListingCardSkeleton while
 * local storage slugs are resolved.
 *
 * @returns Section, loading placeholders, or null when nothing was viewed.
 * @calledBy HomePage
 */
export function RecentlyViewedSection() {
  const slugsJson = useSyncExternalStore(
    subscribeRecentlyViewed,
    getRecentlyViewedSlugsSnapshot,
    getServerRecentlyViewedSnapshot,
  );
  const slugs = JSON.parse(slugsJson) as string[];
  const [listings, setListings] = useState<RecentCard[] | null>(null);

  useEffect(() => {
    const nextSlugs = JSON.parse(slugsJson) as string[];
    if (nextSlugs.length === 0) return;

    let cancelled = false;
    void getRecentlyViewedListingsAction(nextSlugs).then((result) => {
      if (cancelled) return;
      setListings(result.ok ? result.listings : []);
    });

    return () => {
      cancelled = true;
    };
  }, [slugsJson]);

  if (slugs.length === 0) {
    return null;
  }

  if (listings && listings.length === 0) {
    return null;
  }

  const skeletonCount = listings ? 0 : slugs.length;

  return (
    <section className="space-y-4" aria-busy={skeletonCount > 0}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-foreground text-lg font-semibold md:text-2xl">
          Vistos recientemente
        </h2>
        <Link
          href="/explorar"
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-2 hover:underline"
        >
          Explorar
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {skeletonCount > 0
          ? Array.from({ length: skeletonCount }, (_, index) => (
              <ListingCardSkeleton key={index} />
            ))
          : listings.map((listing) => (
              <ListingCard
                key={listing.id}
                href={`/anuncios/${listing.slug}`}
                title={listing.title}
                imageUrl={listing.imageUrl}
                price={listing.finalPrice ?? listing.price}
                batteryHealth={listing.batteryHealth ?? undefined}
                verified={listing.verified}
                conditionLabel={conditionLabels[listing.condition]}
              />
            ))}
      </div>
    </section>
  );
}
