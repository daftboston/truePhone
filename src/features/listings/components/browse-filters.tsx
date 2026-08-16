/**
 * @file browse-filters.tsx
 * @description BrowseFilters component for the listings feature.tsx.
 * @dependencies next/link, @prisma/client, @/features/listings/schemas/browse, @/features/listings/schemas/listing, @/lib/utils
 */

import Link from "next/link";
import type { Condition, IphoneModel, IphoneStorage } from "@prisma/client";

import {
  BROWSE_PRICE_BANDS,
  browseSortOptions,
  buildBrowseHref,
  type BrowseQuery,
} from "@/features/listings/schemas/browse";
import { conditionLabels } from "@/features/listings/schemas/listing";
import { formatStorageLabel } from "@/lib/iphone-catalog";
import { cn } from "@/lib/utils";

type BrowseFiltersProps = {
  query: BrowseQuery;
  models: IphoneModel[];
  storages: IphoneStorage[];
  className?: string;
};

/**
 * FilterLink
 *
 * Renders the Filter Link UI for listings.
 *
 * @param props - FilterLink props.
 * @returns FilterLink React element.
 * @calledBy listings pages and parent components
 */
function FilterLink({
  href,
  label,
  selected,
  compact,
}: {
  href: string;
  label: string;
  selected: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "block rounded-md transition-colors",
        compact ? "px-2 py-1 text-xs" : "px-2.5 py-1 text-xs leading-snug",
        selected
          ? "bg-primary text-primary-foreground font-medium"
          : "text-foreground hover:bg-muted",
      )}
    >
      {label}
    </Link>
  );
}

/**
 * FilterGroup
 *
 * Renders the Filter Group UI for listings.
 *
 * @param props - FilterGroup props.
 * @returns FilterGroup React element.
 * @calledBy listings pages and parent components
 */
function FilterGroup({
  title,
  children,
  row,
}: {
  title: string;
  children: React.ReactNode;
  row?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {title}
      </p>
      <div className={cn(row ? "flex flex-wrap gap-1" : "space-y-px")}>
        {children}
      </div>
    </div>
  );
}

/**
 * shortModelName
 *
 * Supports listings by implementing shortModelName.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
function shortModelName(name: string) {
  return name.replace(/^iPhone\s+/i, "");
}

/**
 * BrowseFilters
 *
 * Renders the Browse Filters UI for listings.
 *
 * @param props - BrowseFilters props.
 * @returns BrowseFilters React element.
 * @calledBy listings pages and parent components
 */
export function BrowseFilters({
  query,
  models,
  storages,
  className,
}: BrowseFiltersProps) {
  const conditions = Object.keys(conditionLabels) as Condition[];

  return (
    <aside className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-foreground text-xs font-semibold">Filtros</h2>
        <Link
          href="/explorar"
          className="text-muted-foreground hover:text-foreground text-[11px] underline-offset-2 hover:underline"
        >
          Cambiar modelo
        </Link>
      </div>

      <FilterGroup title="Ordenar" row>
        {browseSortOptions.map((option) => (
          <FilterLink
            key={option.id}
            compact
            href={buildBrowseHref(query, { sort: option.id, page: 1 })}
            label={option.label}
            selected={query.sort === option.id}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Modelo">
        {models.map((model) => (
          <FilterLink
            key={model.id}
            href={buildBrowseHref(query, {
              modelId: model.id,
              seriesKey: "",
              page: 1,
            })}
            label={shortModelName(model.name)}
            selected={query.modelId === model.id}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Almacenamiento" row>
        <FilterLink
          compact
          href={buildBrowseHref(query, { storageId: "", page: 1 })}
          label="Todos"
          selected={!query.storageId}
        />
        {storages.map((storage) => (
          <FilterLink
            key={storage.id}
            compact
            href={buildBrowseHref(query, {
              storageId: storage.id,
              page: 1,
            })}
            label={formatStorageLabel(storage.valueGb)}
            selected={query.storageId === storage.id}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Estado" row>
        <FilterLink
          compact
          href={buildBrowseHref(query, { condition: "", page: 1 })}
          label="Todos"
          selected={!query.condition}
        />
        {conditions.map((key) => (
          <FilterLink
            key={key}
            compact
            href={buildBrowseHref(query, { condition: key, page: 1 })}
            label={conditionLabels[key]}
            selected={query.condition === key}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Precio" row>
        <FilterLink
          compact
          href={buildBrowseHref(query, { price: "", page: 1 })}
          label="Todos"
          selected={!query.price}
        />
        {BROWSE_PRICE_BANDS.map((band) => (
          <FilterLink
            key={band.id}
            compact
            href={buildBrowseHref(query, { price: band.id, page: 1 })}
            label={band.label}
            selected={query.price === band.id}
          />
        ))}
      </FilterGroup>
    </aside>
  );
}
