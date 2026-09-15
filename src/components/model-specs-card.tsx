"use client";

/**
 * @file model-specs-card.tsx
 * @description Collapsible Apple-style hardware specs for model-scoped browse pages.
 * @dependencies lucide-react, iphone-catalog, iphone-catalog-specs
 */

import { ChevronDown } from "lucide-react";

import { formatStorageLabel } from "@/lib/iphone-catalog";
import type { CatalogModelSpecs } from "@/lib/iphone-catalog-specs";
import { cn } from "@/lib/utils";

type ModelSpecsCardProps = {
  specs: CatalogModelSpecs;
  storageGb: number[];
  releaseYear: number;
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
 * formatDisplaySize
 *
 * Formats the diagonal display size for Spanish UI copy.
 *
 * @param inches - Display diagonal in inches.
 * @returns Localized size label.
 */
function formatDisplaySize(inches: number): string {
  return `${inches.toLocaleString("es-CO", {
    minimumFractionDigits: inches % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })}″`;
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
  const rows: { label: string; value: string }[] = [
    { label: "Resolución de pantalla", value: specs.resolution },
    {
      label: "Tamaño de pantalla",
      value: formatDisplaySize(specs.displaySizeInches),
    },
    ...(specs.ramGb ? [{ label: "RAM", value: `${specs.ramGb} GB` }] : []),
    { label: "Procesador", value: specs.chip },
    { label: "Rango de memorias", value: formatStorageRange(storageGb) },
    { label: "Cámaras", value: specs.cameras },
    ...(specs.batteryMah
      ? [
          {
            label: "Batería",
            value: `${specs.batteryMah.toLocaleString("es-CO")} mAh`,
          },
        ]
      : []),
    { label: "Año de lanzamiento", value: String(releaseYear) },
  ];

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
      <div className="border-border space-y-4 border-t px-4 py-3">
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="space-y-0.5">
              <dt className="text-muted-foreground text-xs">{row.label}</dt>
              <dd className="text-foreground text-sm leading-snug">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
        {specs.uniqueFeatures.length > 0 ? (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">
              Características únicas del modelo
            </p>
            <ul className="text-foreground list-disc space-y-1 pl-4 text-sm leading-snug">
              {specs.uniqueFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}
