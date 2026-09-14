/**
 * @file loading.tsx
 * @description Search results skeleton while published listings load.
 * @dependencies AppShell, ListingCardSkeleton, LoadingSkeleton
 */

import { AppShell } from "@/components/app-shell";
import {
  ListingCardSkeleton,
  LoadingSkeleton,
} from "@/components/loading-skeleton";

/**
 * SearchLoading
 *
 * Renders a title pulse and a 2/3-column listing-card skeleton grid.
 *
 * @returns Search route loading UI.
 * @calledBy Next.js App Router for `/buscar`
 */
export default function SearchLoading() {
  return (
    <AppShell mainClassName="gap-6">
      <div className="space-y-3">
        <LoadingSkeleton className="h-8 w-12" />
        <LoadingSkeleton className="h-8 w-48" />
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
