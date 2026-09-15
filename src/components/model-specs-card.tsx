"use client";

/**
 * @file model-specs-card.tsx
 * @description Collapsible Apple-style hardware specs for model-scoped browse pages.
 * @dependencies lucide-react, model-specs-presentation, iphone-catalog-specs
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
  SpecPairRow,
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
      <div className="border-border border-t px-1 pb-1.5 sm:px-2">
        <div className="divide-border mx-auto flex max-w-md flex-col divide-y">
          <SpecPairRow
            left={{
              icon: <Smartphone className="size-7 stroke-[1.5]" aria-hidden />,
              primary: displaySize,
              secondary: specs.displayMarketingName,
              details: [specs.resolution],
            }}
            right={{
              icon: <HardDrive className="size-7 stroke-[1.5]" aria-hidden />,
              primary: storageRange,
              secondary: "Almacenamiento",
            }}
          />

          <SpecBlock
            icon={<Battery className="size-7 stroke-[1.5]" aria-hidden />}
            primary={batteryCopy.primary}
            secondary={
              [batteryCopy.trailing, specs.batterySecondaryLabel]
                .filter(Boolean)
                .join(" · ") || undefined
            }
          />

          <SpecBlock
            icon={<ChipBadgeIcon label={specs.chipBadge} />}
            primary={specs.chipHeadline}
            secondary={specs.chipDetail}
          />

          <SpecBlock
            icon={<RearCameraIcon variant={specs.cameraModuleVariant} />}
            primary={specs.cameraHeadline}
            details={specs.cameraDetails}
          />

          {specs.frontCameraHeadline ? (
            <SpecBlock
              icon={<FrontCameraIcon />}
              primary={specs.frontCameraHeadline}
              details={frontCameraDetails}
            />
          ) : null}

          {specs.ramGb ? (
            <SpecPairRow
              left={{
                icon: (
                  <MemoryStick className="size-7 stroke-[1.5]" aria-hidden />
                ),
                primary: `${specs.ramGb} GB`,
                secondary: "Memoria RAM",
              }}
              right={{
                icon: <Calendar className="size-7 stroke-[1.5]" aria-hidden />,
                primary: String(releaseYear),
                secondary: "Año de lanzamiento",
              }}
            />
          ) : (
            <SpecBlock
              icon={<Calendar className="size-7 stroke-[1.5]" aria-hidden />}
              primary={String(releaseYear)}
              secondary="Año de lanzamiento"
            />
          )}

          {specs.uniqueFeatures.length > 0 ? (
            <div className="px-2 py-2.5 text-center">
              <div className="text-muted-foreground mb-1 flex justify-center">
                <Sparkles className="size-7 stroke-[1.5]" aria-hidden />
              </div>
              <p className="text-foreground mb-1 text-sm font-semibold">
                Características únicas
              </p>
              <ul className="text-muted-foreground mx-auto grid max-w-sm grid-cols-2 gap-x-2 gap-y-0.5 text-left text-[11px] leading-snug">
                {specs.uniqueFeatures.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </details>
  );
}
