/**
 * @file public-activity-strip.tsx
 * @description Public listing/purchase counters plus optional paid seller-cancel signal.
 * @dependencies @/lib/profile-activity, @/lib/utils
 */

import {
  formatPaidSellerCancelLabel,
  formatPublicActivityLabel,
  type PublicActivityCounts,
} from "@/lib/profile-activity";
import { cn } from "@/lib/utils";

type PublicActivityStripProps = {
  counts: PublicActivityCounts;
  className?: string;
};

/**
 * PublicActivityStrip
 *
 * Renders the public activity sentence and, when present, paid seller-cancel count.
 * Does not show private funnels.
 *
 * @param props.counts - Total / active / bought / paid-cancel counters.
 * @param props.className - Optional text wrapper class (e.g. text-xs on party cards).
 * @returns Localized activity lines.
 * @calledBy ProfileHeader, PartyCard
 */
export function PublicActivityStrip({
  counts,
  className,
}: PublicActivityStripProps) {
  const cancelLabel = formatPaidSellerCancelLabel(counts.paidSellerCancelCount);

  return (
    <div className={cn("text-muted-foreground space-y-1 text-sm", className)}>
      <p>{formatPublicActivityLabel(counts)}</p>
      {cancelLabel ? <p>{cancelLabel}</p> : null}
    </div>
  );
}
