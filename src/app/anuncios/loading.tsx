/**
 * @file loading.tsx
 * @description All-listings feed skeleton while published listings load.
 * @dependencies AppShell, ListingCardSkeleton, LoadingSkeleton
 */

import { AppShell } from "@/components/app-shell";
import {
  ListingCardSkeleton,
  LoadingSkeleton,
} from "@/components/loading-skeleton";

/**
 * AnunciosFeedLoading
 *
 * Renders a title pulse and listing-card skeleton grid for `/anuncios`.
 *
 * @returns Anuncios feed loading UI.
 * @calledBy Next.js App Router for `/anuncios`
 */
export default function AnunciosFeedLoading() {
  return (
    <AppShell mainClassName="gap-6">
      <div className="space-y-3">
        <LoadingSkeleton className="h-8 w-56" />
        <LoadingSkeleton className="h-4 w-full max-w-md" />
        <LoadingSkeleton className="h-16 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 9 }, (_, index) => (
          <ListingCardSkeleton key={index} />
        ))}
      </div>
    </AppShell>
  );
}
