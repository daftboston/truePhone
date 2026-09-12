/**
 * @file queue-tabs.tsx
 * @description Horizontal chip tabs with counts for ops queues.
 * @dependencies next/link, @/lib/utils
 */

import Link from "next/link";

import { cn } from "@/lib/utils";

export type QueueTabItem = {
  id: string;
  label: string;
  href: string;
  count: number;
};

type QueueTabsProps = {
  active: string;
  tabs: QueueTabItem[];
  ariaLabel?: string;
};

/**
 * QueueTabs
 *
 * Renders a horizontally scrolling chip tablist for reviewer/admin queues.
 *
 * @param props.active - Selected tab id.
 * @param props.tabs - Tab labels, hrefs, and counts.
 * @param props.ariaLabel - Accessible name for the tablist.
 * @returns Chip tablist.
 * @calledBy ListingReviewTabs, IdentityReviewTabs, OrderSupportQueuePage
 */
export function QueueTabs({
  active,
  tabs,
  ariaLabel = "Filtros de cola",
}: QueueTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            role="tab"
            aria-selected={selected}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            {tab.label} ({tab.count})
          </Link>
        );
      })}
    </div>
  );
}
