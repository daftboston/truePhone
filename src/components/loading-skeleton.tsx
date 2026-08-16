/**
 * @file loading-skeleton.tsx
 * @description Pulsing placeholder blocks for loading UI states.
 * @dependencies @/lib/utils
 */

import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  className?: string;
};

/**
 * LoadingSkeleton
 *
 * Renders a generic animated pulse block for loading placeholders.
 *
 * @param props.className - Size and shape overrides.
 * @returns Decorative div with aria-hidden.
 * @calledBy ListingCardSkeleton and page-level loading UI
 */
export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn("bg-muted animate-pulse rounded-md", className)}
      aria-hidden
    />
  );
}

/**
 * ListingCardSkeleton
 *
 * Listing-card shaped skeleton (image + two text bars).
 *
 * @param props.className - Wrapper className.
 * @returns Busy skeleton matching ListingCard layout.
 * @calledBy Marketplace grids while listings load
 */
export function ListingCardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true">
      <LoadingSkeleton className="aspect-[4/5] w-full rounded-xl" />
      <LoadingSkeleton className="h-4 w-3/4" />
      <LoadingSkeleton className="h-4 w-1/2" />
    </div>
  );
}
