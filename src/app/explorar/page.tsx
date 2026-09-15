/**
 * @file page.tsx
 * @description Browse/explore marketplace listings by model filters.
 * @dependencies AppShell, listing browse components, ExploreCatalogShell
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ExploreCatalogShell } from "@/features/listings/components/explore-catalog-shell";
import { ExploreSeriesSection } from "@/features/listings/components/explore-series-section";
import { ModelSearch } from "@/features/listings/components/model-search";
import { CompensationBanner } from "@/features/orders/components/compensation-banner";
import { getCurrentProfile } from "@/lib/auth/session";
import { findActiveFeeEntitlementForSource } from "@/lib/financial-core/entitlements";
import { groupModelsBySeries } from "@/lib/iphone-catalog";
import { getCatalog } from "@/lib/listings";
import {
  countPublishedListings,
  listPublishedStockByModel,
} from "@/lib/listings-marketplace";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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
 * @returns Explore page with search, series sections, and model cards.
 */
export default async function ExplorePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestedCompensation =
    typeof params.compensacion === "string" ? params.compensacion : "";
  const [catalog, current, publishedCount, stockByModelId] = await Promise.all([
    getCatalog(),
    requestedCompensation ? getCurrentProfile() : Promise.resolve(null),
    countPublishedListings(),
    listPublishedStockByModel(),
  ]);
  const compensation =
    current && requestedCompensation
      ? await findActiveFeeEntitlementForSource(
          current.profile.id,
          requestedCompensation,
        )
      : null;
  const seriesList = groupModelsBySeries(catalog.models);
  const modelCount = catalog.models.length;

  return (
    <AppShell mainClassName="gap-10 md:gap-12">
      {compensation ? (
        <CompensationBanner sourceOrderId={compensation.sourceOrderId} />
      ) : null}

      <div className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
            Explorar iPhones
          </h1>
          <Link
            href="/comparar"
            className="text-primary shrink-0 text-sm font-medium underline-offset-4 hover:underline md:text-base"
          >
            Comparar
          </Link>
        </div>
        <div className="mx-auto max-w-xl space-y-4 text-center">
          <p className="text-muted-foreground text-sm md:text-base">
            Elige un modelo. Solo verás anuncios revisados por TruePhone.
          </p>
          {publishedCount > 0 ? (
            <div className="flex justify-center">
              <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
                <ShieldCheck className="text-trust size-3.5" aria-hidden />
                {publishedCount === 1
                  ? "1 anuncio publicado"
                  : `${publishedCount} anuncios publicados`}
              </p>
            </div>
          ) : modelCount > 0 ? (
            <p className="text-muted-foreground text-xs font-medium">
              {modelCount === 1 ? "1 modelo" : `${modelCount} modelos`}
            </p>
          ) : null}
          <ModelSearch
            models={catalog.models}
            placeholder="Ej. iPhone 14, 15 Pro…"
            compensationId={compensation?.sourceOrderId}
          />
        </div>
      </div>

      {seriesList.length === 0 ? (
        <EmptyState
          title="Catálogo en preparación"
          description="Aún no hay modelos cargados. Vuelve en un momento."
          action={
            <Button asChild variant="outline">
              <Link href="/">Volver al inicio</Link>
            </Button>
          }
          secondaryAction={
            <Button asChild variant="ghost" size="sm">
              <Link href="/ayuda">Preguntas frecuentes</Link>
            </Button>
          }
        />
      ) : (
        <ExploreCatalogShell>
          <div className="space-y-12 md:space-y-16">
            {seriesList.map((series) => (
              <ExploreSeriesSection
                key={series.key}
                series={series}
                compensationId={compensation?.sourceOrderId}
                stockByModelId={stockByModelId}
              />
            ))}
          </div>
        </ExploreCatalogShell>
      )}

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
