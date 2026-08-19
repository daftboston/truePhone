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
  resolveCatalogModelImages,
  type CatalogModelImages,
} from "@/lib/iphone-catalog-images";
import { cn } from "@/lib/utils";

type ExploreSeriesSectionProps = {
  series: ModelSeries;
};

/**
 * ExploreModelMedia
 *
 * Renders the card well: product shots with a front/back flip, or the silhouette.
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
              className="object-contain p-5"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 272px"
            />
          </div>
          <div className="explore-phone-face explore-phone-face-back">
            <Image
              src={images.back}
              alt=""
              fill
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
}: {
  model: CatalogModel;
  index: number;
}) {
  const images = resolveCatalogModelImages(model.slug);
  const canFlip = Boolean(images.front && images.back);

  return (
    <li
      className="explore-model-item w-[calc(50%-0.375rem)] max-w-[17rem] min-w-[9.5rem] sm:w-[calc(33.333%-0.67rem)] md:w-[calc(25%-0.75rem)]"
      style={{ "--explore-stagger": index } as CSSProperties}
    >
      <Link
        href={browseModelHref(model.id)}
        className={cn(
          "explore-model-card border-border bg-card group flex h-full flex-col overflow-hidden rounded-2xl border",
          "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          canFlip && "explore-model-card--flip",
        )}
      >
        <div className="explore-phone-stage relative aspect-[3/4]">
          <ExploreModelMedia model={model} images={images} />
        </div>
        <div className="space-y-1 px-3 pt-3 pb-4 text-center">
          <p className="text-foreground text-sm font-semibold tracking-tight">
            {model.name}
          </p>
          <p className="text-muted-foreground group-hover:text-primary text-xs font-medium transition-colors">
            Ver anuncios
          </p>
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
 * @returns Explore series section.
 * @calledBy ExplorePage
 */
export function ExploreSeriesSection({ series }: ExploreSeriesSectionProps) {
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
          {modelCount === 1
            ? "1 modelo revisado"
            : `${modelCount} modelos revisados`}
        </p>
        <Link
          href={browseSeriesHref(series.key)}
          className="text-primary inline-flex text-sm font-medium underline-offset-4 hover:underline"
        >
          Ver {series.label}
        </Link>
      </div>

      <ul className="flex flex-wrap justify-center gap-3 md:gap-4">
        {series.models.map((model, index) => (
          <ExploreModelCard key={model.id} model={model} index={index} />
        ))}
      </ul>
    </section>
  );
}
