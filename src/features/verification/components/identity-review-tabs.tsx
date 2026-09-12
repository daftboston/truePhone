/**
 * @file identity-review-tabs.tsx
 * @description Queue chips for identity review tabs with counts.
 * @dependencies @/components/queue-tabs, @/features/verification/schemas/identity
 */

import { QueueTabs } from "@/components/queue-tabs";
import type { IdentityReviewTab } from "@/features/verification/schemas/identity";

type IdentityReviewTabsProps = {
  active: IdentityReviewTab;
  counts: {
    pendiente: number;
    enRevision: number;
    aprobados: number;
    rechazados: number;
  };
};

const TABS: {
  id: IdentityReviewTab;
  label: string;
  countKey: keyof IdentityReviewTabsProps["counts"];
}[] = [
  { id: "pendiente", label: "Pendiente", countKey: "pendiente" },
  { id: "en_revision", label: "En revisión", countKey: "enRevision" },
  { id: "aprobados", label: "Aprobados", countKey: "aprobados" },
  { id: "rechazados", label: "Rechazados", countKey: "rechazados" },
];

/**
 * IdentityReviewTabs
 *
 * Renders identity-review queue filters with counts.
 *
 * @param props.active - Selected tab.
 * @param props.counts - Per-tab identity counts.
 * @returns Queue chip tablist.
 * @calledBy Identity review queue page
 */
export function IdentityReviewTabs({
  active,
  counts,
}: IdentityReviewTabsProps) {
  return (
    <QueueTabs
      active={active}
      ariaLabel="Filtros de cola de identidad"
      tabs={TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        href: `/revision/identidad?tab=${tab.id}`,
        count: counts[tab.countKey],
      }))}
    />
  );
}
