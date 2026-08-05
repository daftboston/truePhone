/**
 * @file page.tsx
 * @description Browse/explore marketplace listings by model filters.
 * @dependencies AppShell, listing browse components and loaders
 */

import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ExploreSeriesSection } from "@/features/listings/components/explore-series-section";
import { ModelSearch } from "@/features/listings/components/model-search";
import { groupModelsBySeries } from "@/lib/iphone-catalog";
import { getCatalog } from "@/lib/listings";

/** Catalog is live DB data; skip build-time prerender (CI has no Postgres). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explorar iPhones",
  description:
    "Elige un modelo de iPhone y ve anuncios revisados en TruePhone.",
};

/**
 * ExplorePage
 *
 * Renders the catalog browse experience for published iPhone listings.
 *
 * @returns Explore page with filters and listing grid.
 */
export default async function ExplorePage() {
  const catalog = await getCatalog();
  const seriesList = groupModelsBySeries(catalog.models);

  return (
    <AppShell mainClassName="max-w-5xl gap-10">
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          Explorar iPhones
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Busca por serie o elige un modelo. Solo verás anuncios revisados por
          TruePhone.
        </p>
        <ModelSearch
          models={catalog.models}
          placeholder="Ej. iPhone 14, 15 Pro…"
        />
      </div>

      <div className="space-y-12 md:space-y-16">
        {seriesList.map((series) => (
          <ExploreSeriesSection key={series.key} series={series} />
        ))}
      </div>

      <p className="text-muted-foreground text-center text-sm">
        ¿No encuentras tu equipo?{" "}
        <Link
          href="/vender"
          className="text-foreground font-medium underline-offset-2 hover:underline"
        >
          Vende tu iPhone
        </Link>
      </p>
    </AppShell>
  );
}
