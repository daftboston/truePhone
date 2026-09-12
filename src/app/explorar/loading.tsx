/**
 * @file loading.tsx
 * @description Explorar hub skeleton: heading pulse and catalog card wells.
 * @dependencies AppShell, LoadingSkeleton
 */

import { AppShell } from "@/components/app-shell";
import { LoadingSkeleton } from "@/components/loading-skeleton";

/**
 * ExploreLoading
 *
 * Renders the series-hub placeholder so navigating from home is not a blank wait.
 *
 * @returns Explore route loading UI.
 * @calledBy Next.js App Router for `/explorar`
 */
export default function ExploreLoading() {
  return (
    <AppShell mainClassName="gap-10 md:gap-12">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3">
        <LoadingSkeleton className="h-8 w-56" />
        <LoadingSkeleton className="h-4 w-72" />
        <LoadingSkeleton className="h-10 w-full max-w-md rounded-xl" />
      </div>
      <div className="space-y-6">
        <LoadingSkeleton className="mx-auto h-6 w-40" />
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="w-[calc(50%-0.375rem)] max-w-[17rem] min-w-[9.5rem] space-y-3 sm:w-[calc(33.333%-0.67rem)] md:w-[calc(25%-0.75rem)]"
            >
              <LoadingSkeleton className="aspect-[3/4] w-full rounded-2xl" />
              <LoadingSkeleton className="mx-auto h-4 w-24" />
              <LoadingSkeleton className="mx-auto h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
