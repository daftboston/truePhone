/**
 * @file filter-chip.tsx
 * @description Selectable filter chip and horizontal chip group for browse UI.
 * @dependencies @/lib/utils
 */

import { cn } from "@/lib/utils";

type FilterChipProps = {
  label: string;
  selected?: boolean;
  className?: string;
  onClick?: () => void;
};

/**
 * FilterChip
 *
 * Toggleable pill button for marketplace filters.
 *
 * @param props.label - Visible chip label.
 * @param props.selected - Pressed/selected visual state.
 * @param props.onClick - Selection handler.
 * @param props.className - Optional className.
 * @returns Button with aria-pressed.
 * @calledBy Explore and search filter bars
 */
export function FilterChip({
  label,
  selected = false,
  className,
  onClick,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-muted",
        className,
      )}
    >
      {label}
    </button>
  );
}

type FilterChipGroupProps = {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
};

/**
 * FilterChipGroup
 *
 * Horizontally scrollable group wrapper for FilterChip children.
 *
 * @param props.children - FilterChip nodes.
 * @param props.className - Optional className.
 * @param props["aria-label"] - Accessible group name.
 * @returns Role=group container.
 * @calledBy Explore and search filter bars
 */
export function FilterChipGroup({
  children,
  className,
  "aria-label": ariaLabel = "Filtros",
}: FilterChipGroupProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
