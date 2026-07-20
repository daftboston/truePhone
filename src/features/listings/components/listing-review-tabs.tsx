import Link from "next/link";

import type { ListingReviewTab } from "@/features/listings/schemas/review";
import { cn } from "@/lib/utils";

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

export function ListingReviewTabs({ active, counts }: ListingReviewTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filtros de cola"
      className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {TABS.map((tab) => {
        const selected = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={`/revision/anuncios?tab=${tab.id}`}
            role="tab"
            aria-selected={selected}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            {tab.label} ({counts[tab.countKey]})
          </Link>
        );
      })}
    </div>
  );
}
