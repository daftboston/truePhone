/**
 * @file model-specs-card.tsx
 * @description Collapsible Apple-style hardware specs for model-scoped browse pages.
 * @dependencies lucide-react, iphone-catalog, iphone-catalog-specs
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
import type { ReactNode } from "react";

import { formatStorageLabel } from "@/lib/iphone-catalog";
import type { CatalogModelSpecs } from "@/lib/iphone-catalog-specs";
import { formatCatalogDisplaySize } from "@/lib/iphone-catalog-specs";
import { cn } from "@/lib/utils";

type ModelSpecsCardProps = {
  specs: CatalogModelSpecs;
  storageGb: number[];
  releaseYear: number;
  className?: string;
};

type SpecBlockProps = {
  icon: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  details?: string[];
  className?: string;
};

/**
 * formatStorageRange
 *
 * Formats the catalog storage options as a Spanish capacity range.
 *
 * @param storageGb - Supported storage sizes in GB.
 * @returns Human-readable range such as "128 GB – 512 GB".
 */
function formatStorageRange(storageGb: number[]): string {
  if (storageGb.length === 0) return "—";
  const sorted = [...storageGb].sort((left, right) => left - right);
  if (sorted.length === 1) {
    return formatStorageLabel(sorted[0]!);
  }
  return `${formatStorageLabel(sorted[0]!)} – ${formatStorageLabel(sorted.at(-1)!)}`;
}

/**
 * SpecBlock
 *
 * Renders one Apple-compare-style spec row: icon, bold primary, softer details.
 *
 * @param props.icon - Thin-stroke icon or badge above the copy.
 * @param props.primary - Large headline value.
 * @param props.secondary - Supporting line under the headline.
 * @param props.details - Optional extra lines (e.g. camera lenses).
 * @param props.className - Optional wrapper classes.
 * @returns Centered spec block.
 */
function SpecBlock({
  icon,
  primary,
  secondary,
  details,
  className,
}: SpecBlockProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-3 py-6 text-center",
        className,
      )}
    >
      <div className="text-muted-foreground flex min-h-10 items-center justify-center">
        {icon}
      </div>
      <div className="space-y-1.5">
        <div className="text-foreground text-xl font-semibold tracking-tight md:text-[1.35rem] md:leading-tight">
          {primary}
        </div>
        {secondary ? (
          <p className="text-muted-foreground text-sm leading-snug">
            {secondary}
          </p>
        ) : null}
        {details && details.length > 0 ? (
          <div className="text-muted-foreground space-y-1 pt-1 text-xs leading-relaxed">
            {details.map((detail) => (
              <p key={detail}>{detail}</p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * ChipBadgeIcon
 *
 * Renders the rounded-square chip badge used in Apple compare layouts.
 *
 * @param label - Short chip name such as "A14" or "A19 PRO".
 * @returns Badge element sized for spec blocks.
 */
function ChipBadgeIcon({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="border-border bg-muted/40 text-foreground flex size-14 items-center justify-center rounded-2xl border px-1"
    >
      <span className="text-[0.65rem] font-semibold tracking-[0.08em] uppercase">
        {label}
      </span>
    </div>
  );
}

/**
 * RearCameraIcon
 *
 * Simple line-art camera bump tuned to dual, triple, or single layouts.
 *
 * @param variant - Rear camera module arrangement.
 * @returns SVG icon.
 */
function RearCameraIcon({
  variant,
}: {
  variant: CatalogModelSpecs["cameraModuleVariant"];
}) {
  if (variant === "single") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 48 48"
        className="size-10 stroke-current"
        fill="none"
        strokeWidth="1.5"
      >
        <rect x="10" y="12" width="28" height="24" rx="7" />
        <circle cx="24" cy="24" r="6.5" />
      </svg>
    );
  }

  if (variant === "dual") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 48 48"
        className="size-10 stroke-current"
        fill="none"
        strokeWidth="1.5"
      >
        <rect x="10" y="12" width="28" height="24" rx="7" />
        <circle cx="19" cy="24" r="5" />
        <circle cx="29" cy="24" r="5" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className="size-10 stroke-current"
      fill="none"
      strokeWidth="1.5"
    >
      <rect x="8" y="12" width="32" height="24" rx="7" />
      <circle cx="17" cy="24" r="4.5" />
      <circle cx="31" cy="24" r="4.5" />
      <circle cx="24" cy="17" r="3.5" />
    </svg>
  );
}

/**
 * FrontCameraIcon
 *
 * Outline icon suggesting Center Stage / front camera tracking.
 *
 * @returns SVG icon.
 */
function FrontCameraIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className="size-10 stroke-current"
      fill="none"
      strokeWidth="1.5"
    >
      <rect x="14" y="8" width="20" height="32" rx="5" />
      <circle cx="24" cy="16" r="2.5" />
      <path d="M8 18c4 4 4 8 0 12" />
      <path d="M40 18c-4 4-4 8 0 12" />
    </svg>
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

  return (
    <details
      className={cn("group border-border bg-card rounded-xl border", className)}
    >
      <summary
        aria-label="Especificaciones del modelo"
        className="text-foreground flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden"
      >
        <span>Especificaciones</span>
        <ChevronDown
          className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-border border-t px-2 pb-2 sm:px-4">
        <div className="divide-border mx-auto flex max-w-md flex-col divide-y">
          <SpecBlock
            icon={<Smartphone className="size-9 stroke-[1.5]" aria-hidden />}
            primary={displaySize}
            secondary={specs.displayMarketingName}
            details={[specs.resolution]}
          />

          <SpecBlock
            icon={<Battery className="size-9 stroke-[1.5]" aria-hidden />}
            primary={specs.batteryPrimaryLabel}
            secondary={specs.batterySecondaryLabel}
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
              details={specs.frontCameraDetails}
            />
          ) : null}

          <SpecBlock
            icon={<HardDrive className="size-9 stroke-[1.5]" aria-hidden />}
            primary={formatStorageRange(storageGb)}
            secondary="Capacidades disponibles en catálogo"
          />

          {specs.ramGb ? (
            <SpecBlock
              icon={<MemoryStick className="size-9 stroke-[1.5]" aria-hidden />}
              primary={`${specs.ramGb} GB`}
              secondary="Memoria RAM"
            />
          ) : null}

          <SpecBlock
            icon={<Calendar className="size-9 stroke-[1.5]" aria-hidden />}
            primary={String(releaseYear)}
            secondary="Año de lanzamiento"
          />

          {specs.uniqueFeatures.length > 0 ? (
            <SpecBlock
              icon={<Sparkles className="size-9 stroke-[1.5]" aria-hidden />}
              primary="Características únicas"
              details={specs.uniqueFeatures}
            />
          ) : null}
        </div>
      </div>
    </details>
  );
}
