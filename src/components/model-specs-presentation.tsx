/**
 * @file model-specs-presentation.tsx
 * @description Shared Apple-style spec blocks and icons for browse and compare UIs.
 * @dependencies lucide-react, iphone-catalog, iphone-catalog-specs
 * @changelog 2026-09-15 — SpecBlock icon/copy wrappers shrink and wrap correctly in horizontal grids.
 */

import type { ReactNode } from "react";

import { formatStorageLabel } from "@/lib/iphone-catalog";
import type { CatalogModelSpecs } from "@/lib/iphone-catalog-specs";
import { cn } from "@/lib/utils";

export type SpecBlockProps = {
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
export function formatStorageRange(storageGb: number[]): string {
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
export function compactDetailLines(lines: string[], maxLines = 2): string[] {
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
export function splitBatteryPrimary(label: string): {
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
 * Renders one compact Apple-compare-style spec block.
 *
 * @param props.icon - Thin-stroke icon or badge above the copy.
 * @param props.primary - Headline value.
 * @param props.secondary - Supporting line under the headline.
 * @param props.details - Optional extra lines (e.g. camera lenses).
 * @param props.className - Optional wrapper classes. Browse uses this to switch
 *   to a left-aligned horizontal cell on desktop.
 * @returns Centered spec block.
 */
export function SpecBlock({
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
      <div className="text-muted-foreground flex min-h-7 shrink-0 items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0 space-y-0.5">
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
 * Renders two compact spec blocks side-by-side.
 *
 * @param props.left - First spec block props.
 * @param props.right - Second spec block props.
 * @returns Two-column spec row.
 */
export function SpecPairRow({
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
 * CompareSpecRow
 *
 * Renders the same spec category for two models in a side-by-side compare row.
 *
 * @param props.left - Left model spec block.
 * @param props.right - Right model spec block.
 * @returns Two-column compare row.
 */
export function CompareSpecRow({
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
export function ChipBadgeIcon({ label }: { label: string }) {
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
export function RearCameraIcon({
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
export function FrontCameraIcon() {
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
