"use client";

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
 * compactDetailLines
 *
 * Limits detail copy to a small number of lines for mobile density.
 *
 * @param lines - Detail strings to render.
 * @param maxLines - Maximum lines to keep.
 * @returns Condensed detail lines.
 */
function compactDetailLines(lines: string[], maxLines = 2): string[] {
  if (lines.length <= maxLines) return lines;
  return [
    ...lines.slice(0, maxLines - 1),
    lines.slice(maxLines - 1).join(" · "),
  ];
}

/**
 * splitBatteryPrimary
 *
 * Breaks long Apple battery playback copy into a compact primary/secondary pair.
 *
 * @param label - Battery primary label from catalog specs.
 * @returns Primary headline and optional trailing clause.
 */
function splitBatteryPrimary(label: string): {
  primary: string;
  trailing?: string;
} {
  const match = label.match(
    /^(Hasta [\d.,]+ horas)( de reproducción de video)$/i,
  );
  if (!match) return { primary: label };
  return { primary: match[1]!, trailing: match[2]!.trim() };
}

/**
 * SpecBlock
 *
 * Renders one compact Apple-compare-style spec row.
 *
 * @param props.icon - Thin-stroke icon or badge above the copy.
 * @param props.primary - Headline value.
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
  const detailLines = details ? compactDetailLines(details) : [];

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 px-2 py-2.5 text-center",
        className,
      )}
    >
      <div className="text-muted-foreground flex min-h-7 items-center justify-center">
        {icon}
      </div>
      <div className="space-y-0.5">
        <div className="text-foreground text-base leading-tight font-semibold tracking-tight">
          {primary}
        </div>
        {secondary ? (
          <p className="text-muted-foreground text-[11px] leading-snug">
            {secondary}
          </p>
        ) : null}
        {detailLines.length > 0 ? (
          <div className="text-muted-foreground space-y-0.5 pt-0.5 text-[11px] leading-snug">
            {detailLines.map((detail) => (
              <p key={detail}>{detail}</p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * SpecPairRow
 *
 * Renders two compact spec blocks side-by-side on mobile.
 *
 * @param props.left - First spec block props.
 * @param props.right - Second spec block props.
 * @returns Two-column spec row.
 */
function SpecPairRow({
  left,
  right,
}: {
  left: SpecBlockProps;
  right: SpecBlockProps;
}) {
  return (
    <div className="divide-border grid grid-cols-2 divide-x">
      <SpecBlock {...left} />
      <SpecBlock {...right} />
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
      className="border-border bg-muted/40 text-foreground flex size-10 items-center justify-center rounded-xl border px-0.5"
    >
      <span className="text-[0.58rem] font-semibold tracking-[0.06em] uppercase">
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
  const className = "size-7 stroke-current";

  if (variant === "single") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 48 48"
        className={className}
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
        className={className}
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
      className={className}
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
      className="size-7 stroke-current"
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
