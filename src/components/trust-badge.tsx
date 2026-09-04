"use client";

/**
 * @file trust-badge.tsx
 * @description Compact verified-seller badge wrapping the design-system Badge.
 * @dependencies @/components/ui/badge, @/lib/utils
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TrustBadgeProps = {
  label?: string;
  className?: string;
};

/**
 * TrustBadge
 *
 * Renders a trust-variant Badge for verified sellers or listings.
 *
 * @param props.label - Badge text; defaults to "Verificado".
 * @param props.className - Optional className merge.
 * @returns Trust-styled Badge element.
 * @calledBy SellerCard, ListingCard, public listing and profile views
 */
export function TrustBadge({
  label = "Verificado",
  className,
}: TrustBadgeProps) {
  return (
    <Badge variant="trust" className={cn("gap-1", className)}>
      {label}
    </Badge>
  );
}
