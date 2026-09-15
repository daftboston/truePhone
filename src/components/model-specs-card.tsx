"use client";

/**
 * @file model-specs-card.tsx
 * @description Collapsible Apple-style hardware specs for model-scoped browse pages.
 * @dependencies lucide-react, model-specs-presentation, iphone-catalog-specs
 * @changelog 2026-09-15 — Desktop uses a horizontal spec grid instead of a tall stacked column.
 */

import {
  Battery,
  Calendar,
  ChevronDown,
  HardDrive,
  MemoryStick,
  Smartphone,
  Sparkles,
} from "lucide-react";

import {
  ChipBadgeIcon,
  FrontCameraIcon,
  RearCameraIcon,
  SpecBlock,
  compactDetailLines,
  formatStorageRange,
  splitBatteryPrimary,
} from "@/components/model-specs-presentation";
import type { CatalogModelSpecs } from "@/lib/iphone-catalog-specs";
import { formatCatalogDisplaySize } from "@/lib/iphone-catalog-specs";
import { cn } from "@/lib/utils";

type ModelSpecsCardProps = {
  specs: CatalogModelSpecs;
  storageGb: number[];
  releaseYear: number;
  className?: string;
};

type SpecCellSpan = "half" | "full";

/**
 * specBrowseCellClass
 *
 * Builds grid + alignment classes so spec cells stack in pairs on mobile
 * and sit in a compact horizontal row on desktop.
 *
 * @param span - `full` stretches the cell on mobile; `half` shares a 2-col row.
 * @returns Tailwind class string for one browse spec cell.
 * @calledBy ModelSpecsCard
 */
function specBrowseCellClass(span: SpecCellSpan): string {
  return cn(
    "border-border border-b md:border-0",
    span === "full" && "col-span-2 md:col-span-1",
    "md:flex-row md:items-start md:justify-start md:gap-3 md:px-3 md:py-3 md:text-left",
  );
}

/**
 * ModelSpecsCard
 *
 * Renders a collapsed-by-default disclosure with official model hardware specs.
 *
 * @param props.specs - Published hardware specs for the selected model.
 * @param props.storageGb - Supported storage capacities from the catalog seed.
 * @param props.releaseYear - Model launch year from the catalog.
 * @param props.className - Optional wrapper classes.
 * @returns Collapsible specs card.
 * @calledBy SearchPage
 */
export function ModelSpecsCard({
  specs,
  storageGb,
  releaseYear,
  className,
}: ModelSpecsCardProps) {
  const displaySize = formatCatalogDisplaySize(specs.displaySizeInches);
  const storageRange = formatStorageRange(storageGb);
  const batteryCopy = splitBatteryPrimary(specs.batteryPrimaryLabel);
  const frontCameraDetails = specs.frontCameraDetails
    ? compactDetailLines(specs.frontCameraDetails, 1)
    : undefined;

  return (
    <details
      className={cn("group border-border bg-card rounded-xl border", className)}
    >
      <summary
        aria-label="Especificaciones del modelo"
        className="text-foreground flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden"
      >
        <span>Especificaciones</span>
        <ChevronDown
          className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-border border-t px-1 pb-1.5 sm:px-2 md:px-2 md:pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 [&>*:last-child]:border-b-0">
          <SpecBlock
            className={specBrowseCellClass("half")}
            icon={<Smartphone className="size-7 stroke-[1.5]" aria-hidden />}
            primary={displaySize}
            secondary={specs.displayMarketingName}
            details={[specs.resolution]}
          />
          <SpecBlock
            className={specBrowseCellClass("half")}
            icon={<HardDrive className="size-7 stroke-[1.5]" aria-hidden />}
            primary={storageRange}
            secondary="Almacenamiento"
          />

          <SpecBlock
            className={specBrowseCellClass("full")}
            icon={<Battery className="size-7 stroke-[1.5]" aria-hidden />}
            primary={batteryCopy.primary}
            secondary={
              [batteryCopy.trailing, specs.batterySecondaryLabel]
                .filter(Boolean)
                .join(" · ") || undefined
            }
          />

          <SpecBlock
            className={specBrowseCellClass("full")}
            icon={<ChipBadgeIcon label={specs.chipBadge} />}
            primary={specs.chipHeadline}
            secondary={specs.chipDetail}
          />

          <SpecBlock
            className={specBrowseCellClass("full")}
            icon={<RearCameraIcon variant={specs.cameraModuleVariant} />}
            primary={specs.cameraHeadline}
            details={specs.cameraDetails}
          />

          {specs.frontCameraHeadline ? (
            <SpecBlock
              className={specBrowseCellClass("full")}
              icon={<FrontCameraIcon />}
              primary={specs.frontCameraHeadline}
              details={frontCameraDetails}
            />
          ) : null}

          {specs.ramGb ? (
            <SpecBlock
              className={specBrowseCellClass("half")}
              icon={<MemoryStick className="size-7 stroke-[1.5]" aria-hidden />}
              primary={`${specs.ramGb} GB`}
              secondary="Memoria RAM"
            />
          ) : null}

          <SpecBlock
            className={specBrowseCellClass(specs.ramGb ? "half" : "full")}
            icon={<Calendar className="size-7 stroke-[1.5]" aria-hidden />}
            primary={String(releaseYear)}
            secondary="Año de lanzamiento"
          />

          {specs.uniqueFeatures.length > 0 ? (
            <div className="border-border col-span-2 px-2 py-2.5 text-center md:col-span-4 md:flex md:items-start md:gap-3 md:border-t md:px-3 md:py-3 md:text-left">
              <div className="text-muted-foreground mb-1 flex justify-center md:mb-0 md:shrink-0">
                <Sparkles className="size-7 stroke-[1.5]" aria-hidden />
              </div>
              <div className="min-w-0 md:flex-1">
                <p className="text-foreground mb-1 text-sm font-semibold">
                  Características únicas
                </p>
                <ul className="text-muted-foreground mx-auto grid max-w-sm grid-cols-2 gap-x-2 gap-y-0.5 text-left text-[11px] leading-snug md:mx-0 md:max-w-none md:grid-cols-3 lg:grid-cols-4">
                  {specs.uniqueFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </details>
  );
}
