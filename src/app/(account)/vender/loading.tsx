/**
 * @file loading.tsx
 * @description Seller listings hub skeleton.
 * @dependencies LoadingSkeleton
 */

import { LoadingSkeleton } from "@/components/loading-skeleton";

/**
 * SellHubLoading
 *
 * Renders the Anuncios activos placeholder (not listing wizard steps).
 *
 * @returns Seller hub loading UI.
 * @calledBy Next.js App Router for `(account)/vender`
 */
export default function SellHubLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <LoadingSkeleton className="h-7 w-48" />
          <LoadingSkeleton className="h-4 w-72" />
        </div>
        <LoadingSkeleton className="h-10 w-32 rounded-lg" />
      </div>
      {Array.from({ length: 4 }, (_, index) => (
        <LoadingSkeleton key={index} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}
