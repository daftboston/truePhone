/**
 * @file listing-review-tabs.tsx
 * @description Queue chips for listing review tabs with counts.
 * @dependencies @/components/queue-tabs, @/features/listings/schemas/review
 */

import { QueueTabs } from "@/components/queue-tabs";
import type { ListingReviewTab } from "@/features/listings/schemas/review";

type ListingReviewTabsProps = {
  active: ListingReviewTab;
  counts: {
    todos: number;
    pendiente: number;
    enRevision: number;
    aprobados: number;
    rechazados: number;
  };
};

const TABS: {
  id: ListingReviewTab;
  label: string;
  countKey: keyof ListingReviewTabsProps["counts"];
}[] = [
  { id: "pendiente", label: "Pendiente", countKey: "pendiente" },
  { id: "en_revision", label: "En revisión", countKey: "enRevision" },
  { id: "aprobados", label: "Aprobados", countKey: "aprobados" },
  { id: "rechazados", label: "Rechazados", countKey: "rechazados" },
  { id: "todos", label: "Todos", countKey: "todos" },
];

/**
 * ListingReviewTabs
 *
 * Renders listing-review queue filters with counts.
 *
 * @param props.active - Selected tab.
 * @param props.counts - Per-tab listing counts.
 * @returns Queue chip tablist.
 * @calledBy Listing review queue page
 */
export function ListingReviewTabs({ active, counts }: ListingReviewTabsProps) {
  return (
    <QueueTabs
      active={active}
      ariaLabel="Filtros de cola de anuncios"
      tabs={TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        href: `/revision/anuncios?tab=${tab.id}`,
        count: counts[tab.countKey],
      }))}
    />
  );
}
