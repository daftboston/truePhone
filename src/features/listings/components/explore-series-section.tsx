/**
 * @file explore-series-section.tsx
 * @description Series heading plus centered model cards for the Explorar hub.
 * @dependencies next/image, next/link, IphoneModelGlyph, catalog helpers
 */

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { IphoneModelGlyph } from "@/components/iphone-model-glyph";
import {
  browseModelHref,
  browseSeriesHref,
  type CatalogModel,
  type ModelSeries,
} from "@/lib/iphone-catalog";
import {
  formatExploreModelStock,
  formatExploreSeriesModelCount,
  type ExploreModelStock,
} from "@/features/listings/lib/explore-stock";
import {
  resolveCatalogModelImages,
  type CatalogModelImages,
} from "@/lib/iphone-catalog-images";
import { cn } from "@/lib/utils";

type ExploreSeriesSectionProps = {
  series: ModelSeries;
  compensationId?: string;
  stockByModelId: Map<string, ExploreModelStock>;
};

/**
 * ExploreAppleMark
 *
 * Small decorative Apple glyph in the card footer, matching store-style model tiles.
 *
 * @returns Hidden-from-AT SVG mark.
 * @calledBy ExploreModelCard
 */
function ExploreAppleMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="text-muted-foreground/70 absolute right-3 bottom-3 size-3.5"
    >
      <path
        fill="currentColor"
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      />
    </svg>
  );
}

/**
 * ExploreModelMedia
 *
 * Renders the card well: product shots with a front/back flip, or the silhouette.
 * Catalog shots stay `unoptimized` so Next.js does not flatten WebP alpha onto white.
 *
 * @param props.model - Catalog model for the fallback glyph.
 * @param props.images - Resolved public URLs from `public/catalog`.
 * @returns Centered media for one explore card.
 * @calledBy ExploreModelCard
 */
function ExploreModelMedia({
  model,
  images,
}: {
  model: CatalogModel;
  images: CatalogModelImages;
}) {
  if (images.front && images.back) {
    return (
      <div className="explore-phone-flip">
        <div className="explore-phone-flip-inner">
          <div className="explore-phone-face explore-phone-face-front">
            <Image
              src={images.front}
              alt=""
              fill
              unoptimized
              className="object-contain p-5"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 272px"
            />
          </div>
          <div className="explore-phone-face explore-phone-face-back">
            <Image
              src={images.back}
              alt=""
              fill
              unoptimized
              className="object-contain p-5"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 272px"
            />
          </div>
        </div>
      </div>
    );
  }

  if (images.front) {
    return (
      <div className="absolute inset-0">
        <Image
          src={images.front}
          alt=""
          fill
          unoptimized
          className="object-contain p-5"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 272px"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <IphoneModelGlyph model={model} />
    </div>
  );
}

/**
 * ExploreModelCard
 *
 * Renders one catalog model as a studio-style picker card.
 *
 * @param props.model - Catalog model for the glyph and name.
 * @param props.index - Stagger index for the entrance animation.
 * @returns Linked card to filtered browse results.
 * @calledBy ExploreSeriesSection
 */
function ExploreModelCard({
  model,
  index,
  compensationId,
  stock,
}: {
  model: CatalogModel;
  index: number;
  compensationId?: string;
  stock: ExploreModelStock;
}) {
  const images = resolveCatalogModelImages(model.slug);
  const canFlip = Boolean(images.front && images.back);
  const stockLine = formatExploreModelStock(stock);

  return (
    <li
      className="explore-model-item w-[calc(50%-0.375rem)] max-w-[17rem] min-w-[9.5rem] sm:w-[calc(33.333%-0.67rem)] md:w-[calc(25%-0.75rem)]"
      style={{ "--explore-stagger": String(index) } as CSSProperties}
    >
      <Link
        href={`${browseModelHref(model.id)}${compensationId ? `&compensacion=${encodeURIComponent(compensationId)}` : ""}`}
        className={cn(
          "explore-model-card border-border bg-card group flex h-full flex-col overflow-hidden rounded-2xl border",
          "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          canFlip && "explore-model-card--flip",
        )}
      >
        <div className="explore-phone-stage relative aspect-[3/4]">
          <ExploreModelMedia model={model} images={images} />
        </div>
        <div className="relative space-y-1 px-3 pt-3 pr-8 pb-4 text-center">
          <p className="text-foreground text-sm font-semibold tracking-tight">
            {model.name}
          </p>
          <p className="text-muted-foreground group-hover:text-primary text-xs font-medium transition-colors">
            {stockLine}
          </p>
          <ExploreAppleMark />
        </div>
      </Link>
    </li>
  );
}

/**
 * ExploreSeriesSection
 *
 * Renders a series label and a centered wrap of model cards.
 *
 * @param props.series - Grouped models for one product-line family.
 * @param props.compensationId - Optional fee-entitlement query to pass through.
 * @param props.stockByModelId - Published listing counts and floor prices.
 * @returns Explore series section.
 * @calledBy ExplorePage
 */
export function ExploreSeriesSection({
  series,
  compensationId,
  stockByModelId,
}: ExploreSeriesSectionProps) {
  const modelCount = series.models.length;

  return (
    <section className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex items-center gap-3">
          <span className="bg-border h-px flex-1" aria-hidden />
          <h2 className="text-foreground text-lg font-semibold tracking-tight md:text-xl">
            {series.label}
          </h2>
          <span className="bg-border h-px flex-1" aria-hidden />
        </div>
        <p className="text-muted-foreground text-sm">
          {formatExploreSeriesModelCount(modelCount)}
        </p>
        <Link
          href={`${browseSeriesHref(series.key)}${compensationId ? `&compensacion=${encodeURIComponent(compensationId)}` : ""}`}
          className="text-primary inline-flex text-sm font-medium underline-offset-4 hover:underline"
        >
          Ver {series.label}
        </Link>
      </div>

      <ul className="flex flex-wrap justify-center gap-3 md:gap-4">
        {series.models.map((model, index) => (
          <ExploreModelCard
            key={model.id}
            model={model}
            index={index}
            compensationId={compensationId}
            stock={
              stockByModelId.get(model.id) ?? {
                count: 0,
                minBuyerPrice: null,
              }
            }
          />
        ))}
      </ul>
    </section>
  );
}
