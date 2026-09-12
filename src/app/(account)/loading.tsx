/**
 * @file loading.tsx
 * @description Account-area skeleton for perfil, compras, ventas, and related hubs.
 * @dependencies LoadingSkeleton
 */

import { LoadingSkeleton } from "@/components/loading-skeleton";

/**
 * AccountLoading
 *
 * Renders heading and card wells while an authenticated account page loads.
 *
 * @returns Account route loading UI.
 * @calledBy Next.js App Router for `(account)` pages
 */
export default function AccountLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <LoadingSkeleton className="h-7 w-40" />
        <LoadingSkeleton className="h-4 w-64" />
      </div>
      <LoadingSkeleton className="h-28 w-full rounded-xl" />
      <LoadingSkeleton className="h-24 w-full rounded-xl" />
      <LoadingSkeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}
