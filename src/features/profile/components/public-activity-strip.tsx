/**
 * @file public-activity-strip.tsx
 * @description One-line public listing/purchase counters (Swappa-style trust strip).
 * @dependencies @/lib/profile-activity, @/lib/utils
 */

import {
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
 * Renders the public activity sentence. Does not show private funnels.
 *
 * @param props.counts - Total / active / bought counters.
 * @param props.className - Optional text wrapper class.
 * @returns Localized activity line.
 * @calledBy ProfileHeader, PartyCard
 */
export function PublicActivityStrip({
  counts,
  className,
}: PublicActivityStripProps) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)}>
      {formatPublicActivityLabel(counts)}
    </p>
  );
}
