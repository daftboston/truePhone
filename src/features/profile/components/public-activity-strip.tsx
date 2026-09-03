/**
 * @file public-activity-strip.tsx
 * @description Public listing and completed-purchase counters.
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
 * Renders the public activity sentence.
 * Does not show private funnels.
 *
 * @param props.counts - Total / active / bought counters.
 * @param props.className - Optional text wrapper class (e.g. text-xs on party cards).
 * @returns Localized activity lines.
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
