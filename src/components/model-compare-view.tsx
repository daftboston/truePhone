/**
 * @file model-compare-view.tsx
 * @description Side-by-side Apple-style hardware comparison for two catalog models.
 * @dependencies lucide-react, model-specs-presentation, iphone-catalog-specs
 * @changelog 2026-09-15 — Battery mAh caption; unique features aligned as compare rows.
 */

import {
  Battery,
  Calendar,
  HardDrive,
  MemoryStick,
  Smartphone,
  Sparkles,
} from "lucide-react";

import {
  ChipBadgeIcon,
  CompareSpecRow,
  FrontCameraIcon,
  RearCameraIcon,
  compactDetailLines,
  formatStorageRange,
} from "@/components/model-specs-presentation";
import {
  alignUniqueFeatures,
  formatCatalogDisplaySize,
  type CatalogModelSpecs,
} from "@/lib/iphone-catalog-specs";
import { cn } from "@/lib/utils";

export type CompareModelEntry = {
  name: string;
  specs: CatalogModelSpecs;
  storageGb: number[];
  releaseYear: number;
};

type ModelCompareViewProps = {
  left: CompareModelEntry;
  right: CompareModelEntry;
  className?: string;
};

type ModelSpecPresentation = {
  displaySize: string;
  storageRange: string;
  frontCameraDetails?: string[];
};

/**
 * buildModelSpecPresentation
 *
 * Normalizes catalog specs into the values rendered in compare rows.
 *
 * @param entry - Model with published hardware specs.
 * @returns Presentation-friendly spec values.
 */
function buildModelSpecPresentation(
  entry: CompareModelEntry,
): ModelSpecPresentation {
  return {
    displaySize: formatCatalogDisplaySize(entry.specs.displaySizeInches),
    storageRange: formatStorageRange(entry.storageGb),
    frontCameraDetails: entry.specs.frontCameraDetails
      ? compactDetailLines(entry.specs.frontCameraDetails, 1)
      : undefined,
  };
}

/**
 * UniqueFeaturesCompareRow
 *
 * Renders notable features as aligned compare rows so shared names sit side by side.
 *
 * @param props.left - Left model feature list.
 * @param props.right - Right model feature list.
 * @returns Two-column unique-features block.
 */
function UniqueFeaturesCompareRow({
  left,
  right,
}: {
  left: string[];
  right: string[];
}) {
  const rows = alignUniqueFeatures(left, right);

  return (
    <div>
      <div className="divide-border grid grid-cols-2 divide-x">
        {["left", "right"].map((side) => (
          <div
            key={side}
            className="flex flex-col items-center gap-1.5 px-2 py-2.5 text-center"
          >
            <div className="text-muted-foreground flex min-h-7 items-center justify-center">
              <Sparkles className="size-7 stroke-[1.5]" aria-hidden />
            </div>
            <p className="text-foreground text-sm font-semibold">
              Características destacadas
            </p>
          </div>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={row.left !== "—" ? row.left : row.right}
          className="divide-border grid grid-cols-2 divide-x border-t"
        >
          <p className="text-muted-foreground px-2 py-1.5 text-center text-[11px] leading-snug">
            {row.left}
          </p>
          <p className="text-muted-foreground px-2 py-1.5 text-center text-[11px] leading-snug">
            {row.right}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * ModelCompareView
 *
 * Renders a full hardware comparison table for two selected models.
 *
 * @param props.left - Left model entry.
 * @param props.right - Right model entry.
 * @param props.className - Optional wrapper classes.
 * @returns Side-by-side compare layout.
 * @calledBy CompareModelsShell
 */
export function ModelCompareView({
  left,
  right,
  className,
}: ModelCompareViewProps) {
  const leftPresentation = buildModelSpecPresentation(left);
  const rightPresentation = buildModelSpecPresentation(right);
  const showFrontCamera =
    Boolean(left.specs.frontCameraHeadline) ||
    Boolean(right.specs.frontCameraHeadline);
  const showRam = Boolean(left.specs.ramGb) || Boolean(right.specs.ramGb);

  return (
    <div
      className={cn(
        "border-border bg-card overflow-hidden rounded-xl border",
        className,
      )}
    >
      <div className="divide-border grid grid-cols-2 divide-x border-b">
        <div className="px-3 py-4 text-center">
          <p className="text-foreground text-sm font-semibold tracking-tight md:text-base">
            {left.name}
          </p>
        </div>
        <div className="px-3 py-4 text-center">
          <p className="text-foreground text-sm font-semibold tracking-tight md:text-base">
            {right.name}
          </p>
        </div>
      </div>

      <div className="divide-border flex flex-col divide-y">
        <CompareSpecRow
          left={{
            icon: <Smartphone className="size-7 stroke-[1.5]" aria-hidden />,
            primary: leftPresentation.displaySize,
            secondary: left.specs.displayMarketingName,
            details: [left.specs.resolution],
          }}
          right={{
            icon: <Smartphone className="size-7 stroke-[1.5]" aria-hidden />,
            primary: rightPresentation.displaySize,
            secondary: right.specs.displayMarketingName,
            details: [right.specs.resolution],
          }}
        />

        <CompareSpecRow
          left={{
            icon: <HardDrive className="size-7 stroke-[1.5]" aria-hidden />,
            primary: leftPresentation.storageRange,
            secondary: "Almacenamiento",
          }}
          right={{
            icon: <HardDrive className="size-7 stroke-[1.5]" aria-hidden />,
            primary: rightPresentation.storageRange,
            secondary: "Almacenamiento",
          }}
        />

        <CompareSpecRow
          left={{
            icon: <Battery className="size-7 stroke-[1.5]" aria-hidden />,
            primary: left.specs.batteryPrimaryLabel,
            secondary: left.specs.batterySecondaryLabel,
          }}
          right={{
            icon: <Battery className="size-7 stroke-[1.5]" aria-hidden />,
            primary: right.specs.batteryPrimaryLabel,
            secondary: right.specs.batterySecondaryLabel,
          }}
        />

        <CompareSpecRow
          left={{
            icon: <ChipBadgeIcon label={left.specs.chipBadge} />,
            primary: left.specs.chipHeadline,
            secondary: left.specs.chipDetail,
          }}
          right={{
            icon: <ChipBadgeIcon label={right.specs.chipBadge} />,
            primary: right.specs.chipHeadline,
            secondary: right.specs.chipDetail,
          }}
        />

        <CompareSpecRow
          left={{
            icon: <RearCameraIcon variant={left.specs.cameraModuleVariant} />,
            primary: left.specs.cameraHeadline,
            details: left.specs.cameraDetails,
          }}
          right={{
            icon: <RearCameraIcon variant={right.specs.cameraModuleVariant} />,
            primary: right.specs.cameraHeadline,
            details: right.specs.cameraDetails,
          }}
        />

        {showFrontCamera ? (
          <CompareSpecRow
            left={{
              icon: <FrontCameraIcon />,
              primary: left.specs.frontCameraHeadline ?? "—",
              details: leftPresentation.frontCameraDetails,
            }}
            right={{
              icon: <FrontCameraIcon />,
              primary: right.specs.frontCameraHeadline ?? "—",
              details: rightPresentation.frontCameraDetails,
            }}
          />
        ) : null}

        {showRam ? (
          <CompareSpecRow
            left={{
              icon: <MemoryStick className="size-7 stroke-[1.5]" aria-hidden />,
              primary: left.specs.ramGb ? `${left.specs.ramGb} GB` : "—",
              secondary: "Memoria RAM",
            }}
            right={{
              icon: <MemoryStick className="size-7 stroke-[1.5]" aria-hidden />,
              primary: right.specs.ramGb ? `${right.specs.ramGb} GB` : "—",
              secondary: "Memoria RAM",
            }}
          />
        ) : null}

        <CompareSpecRow
          left={{
            icon: <Calendar className="size-7 stroke-[1.5]" aria-hidden />,
            primary: String(left.releaseYear),
            secondary: "Año de lanzamiento",
          }}
          right={{
            icon: <Calendar className="size-7 stroke-[1.5]" aria-hidden />,
            primary: String(right.releaseYear),
            secondary: "Año de lanzamiento",
          }}
        />

        {left.specs.uniqueFeatures.length > 0 ||
        right.specs.uniqueFeatures.length > 0 ? (
          <UniqueFeaturesCompareRow
            left={left.specs.uniqueFeatures}
            right={right.specs.uniqueFeatures}
          />
        ) : null}
      </div>
    </div>
  );
}
