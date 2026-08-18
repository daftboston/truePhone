/**
 * @file iphone-model-glyph.tsx
 * @description Centered catalog iPhone silhouette that matches face and size variant.
 * @dependencies react, @/lib/iphone-catalog, @/lib/utils
 */

import { useId } from "react";

import { getIphoneFaceStyle, type CatalogModel } from "@/lib/iphone-catalog";
import type { IphoneVariantTypeId } from "@/lib/iphone-catalog-data";
import { cn } from "@/lib/utils";

type IphoneModelGlyphProps = {
  model: Pick<CatalogModel, "productLine" | "generation" | "variantType">;
  className?: string;
};

const VARIANT_FRAME_CLASS: Record<IphoneVariantTypeId, string> = {
  MINI: "h-[56%] w-auto",
  STANDARD: "h-[64%] w-auto",
  E: "h-[62%] w-auto",
  PLUS: "h-[68%] w-auto",
  PRO: "h-[66%] w-auto",
  PRO_MAX: "h-[72%] w-auto",
  AIR: "h-[70%] w-[34%]",
};

/**
 * IphoneModelGlyph
 *
 * Draws a modern iPhone silhouette (SE home button, notch, or Dynamic Island)
 * scaled to the catalog variant so explore cards look like a product studio.
 *
 * @param props.model - Product line, generation, and variant for face/size.
 * @param props.className - Optional extra classes on the SVG.
 * @returns Decorative SVG; hidden from assistive tech.
 * @calledBy ExploreSeriesSection, ModelSearch
 */
export function IphoneModelGlyph({ model, className }: IphoneModelGlyphProps) {
  const face = getIphoneFaceStyle(model);
  const paintId = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 120 248"
      fill="none"
      aria-hidden
      className={cn(
        "explore-phone-glyph overflow-visible",
        VARIANT_FRAME_CLASS[model.variantType],
        className,
      )}
    >
      <defs>
        <linearGradient id={`${paintId}-body`} x1="20" y1="8" x2="100" y2="240">
          <stop
            offset="0%"
            stopColor="currentColor"
            stopOpacity={model.variantType === "AIR" ? 0.72 : 0.88}
          />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0.55} />
        </linearGradient>
        <linearGradient
          id={`${paintId}-glass`}
          x1="28"
          y1="24"
          x2="88"
          y2="220"
        >
          <stop offset="0%" stopColor="var(--background)" stopOpacity={0.95} />
          <stop offset="100%" stopColor="var(--muted)" stopOpacity={0.92} />
        </linearGradient>
      </defs>

      {/* Volume / mute rails */}
      <rect
        x="4.5"
        y="78"
        width="4"
        height="18"
        rx="1.5"
        className="fill-foreground/40"
      />
      <rect
        x="4.5"
        y="102"
        width="4"
        height="28"
        rx="1.5"
        className="fill-foreground/40"
      />
      <rect
        x="111.5"
        y="92"
        width="4"
        height="36"
        rx="1.5"
        className="fill-foreground/40"
      />

      <rect
        x="10"
        y="8"
        width="100"
        height="232"
        rx={face === "home" ? 22 : 28}
        fill={`url(#${paintId}-body)`}
      />
      <rect
        x="16"
        y={face === "home" ? 22 : 16}
        width="88"
        height={face === "home" ? 178 : 216}
        rx={face === "home" ? 6 : 20}
        fill={`url(#${paintId}-glass)`}
      />

      {face === "home" ? (
        <>
          <rect
            x="48"
            y="14"
            width="24"
            height="4"
            rx="2"
            className="fill-background/80"
          />
          <circle
            cx="60"
            cy="218"
            r="10"
            className="stroke-background/70 fill-none"
            strokeWidth="2.5"
          />
        </>
      ) : null}

      {face === "notch" ? (
        <path
          d="M44 16h32c4 0 6 2 6 6v8c0 4-2 6-6 6H44c-4 0-6-2-6-6v-8c0-4 2-6 6-6Z"
          className="fill-foreground/80"
        />
      ) : null}

      {face === "island" ? (
        <rect
          x="44"
          y="22"
          width="32"
          height="11"
          rx="5.5"
          className="fill-foreground/85"
        />
      ) : null}

      {face !== "home" ? (
        <rect
          x="50"
          y="220"
          width="20"
          height="3"
          rx="1.5"
          className="fill-foreground/25"
        />
      ) : null}
    </svg>
  );
}
