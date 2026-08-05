/**
 * @file explore-series-section.tsx
 * @description ExploreSeriesSection component for the listings feature.tsx.
 * @dependencies next/link, lucide-react, @/lib/iphone-catalog
 */

import Link from "next/link";
import { Smartphone } from "lucide-react";

import {
  browseModelHref,
  browseSeriesHref,
  type ModelSeries,
} from "@/lib/iphone-catalog";

type ExploreSeriesSectionProps = {
  series: ModelSeries;
};

/**
 * ExploreSeriesSection
 *
 * Renders the Explore Series Section UI for listings.
 *
 * @param props - ExploreSeriesSection props.
 * @returns ExploreSeriesSection React element.
 * @calledBy listings pages and parent components
 */
export function ExploreSeriesSection({ series }: ExploreSeriesSectionProps) {
  return (
    <section className="space-y-5">
      <div className="space-y-2 text-center">
        <div className="flex items-center gap-3">
          <span className="bg-border h-px flex-1" aria-hidden />
          <h2 className="text-foreground text-lg font-semibold tracking-tight md:text-xl">
            {series.label}
          </h2>
          <span className="bg-border h-px flex-1" aria-hidden />
        </div>
        <p className="text-muted-foreground text-sm">
          Elige un modelo para ver anuncios revisados.
        </p>
        <Link
          href={browseSeriesHref(series.key)}
          className="text-primary inline-flex text-sm font-medium underline-offset-4 hover:underline"
        >
          Ver {series.label}
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
        {series.models.map((model) => (
          <li key={model.id}>
            <Link
              href={browseModelHref(model.id)}
              className="border-border bg-card hover:border-primary group flex h-full flex-col overflow-hidden rounded-xl border transition-colors"
            >
              <div className="bg-muted text-muted-foreground flex aspect-[4/5] items-center justify-center">
                <Smartphone
                  className="size-12 opacity-40 transition-opacity group-hover:opacity-70"
                  aria-hidden
                />
              </div>
              <div className="space-y-1 p-3 text-center">
                <p className="text-foreground text-sm font-semibold">
                  {model.name}
                </p>
                <p className="text-muted-foreground text-xs">Ver anuncios</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
