"use client";

/**
 * @file recently-viewed-section.tsx
 * @description RecentlyViewedSection component for the listings feature.tsx.
 * @dependencies next/link, react, @/components/listing-card, @/features/listings/actions/recently-viewed, @/features/listings/schemas/listing
 */

import Link from "next/link";
import { useEffect, useState } from "react";

import { ListingCard } from "@/components/listing-card";
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

/**
 * RecentlyViewedSection
 *
 * Renders the Recently Viewed Section UI for listings.
 *
 * @param props - RecentlyViewedSection props.
 * @returns RecentlyViewedSection React element.
 * @calledBy listings pages and parent components
 */
export function RecentlyViewedSection() {
  const [listings, setListings] = useState<RecentCard[]>([]);

  useEffect(() => {
    const items = readRecentlyViewed();
    if (items.length === 0) return;

    let cancelled = false;
    void getRecentlyViewedListingsAction(items.map((item) => item.slug)).then(
      (result) => {
        if (!cancelled && result.ok) {
          setListings(result.listings);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  if (listings.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
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
        {listings.map((listing) => (
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
