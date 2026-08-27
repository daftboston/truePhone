/**
 * @file page.tsx
 * @description Browse/explore marketplace listings by model filters.
 * @dependencies AppShell, listing browse components and loaders
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ExploreSeriesSection } from "@/features/listings/components/explore-series-section";
import { ModelSearch } from "@/features/listings/components/model-search";
import { CompensationBanner } from "@/features/orders/components/compensation-banner";
import { getCurrentProfile } from "@/lib/auth/session";
import { findActiveFeeEntitlementForSource } from "@/lib/financial-core/entitlements";
import { groupModelsBySeries } from "@/lib/iphone-catalog";
import { getCatalog } from "@/lib/listings";

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
  const [catalog, current] = await Promise.all([
    getCatalog(),
    requestedCompensation ? getCurrentProfile() : Promise.resolve(null),
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

      <div className="mx-auto max-w-xl space-y-4 text-center">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          Explorar iPhones
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Elige un modelo. Solo verás anuncios revisados por TruePhone.
        </p>
        {modelCount > 0 ? (
          <div className="flex justify-center">
            <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
              <ShieldCheck className="text-trust size-3.5" aria-hidden />
              {modelCount} modelos · inventario revisado
            </p>
          </div>
        ) : null}
        <ModelSearch
          models={catalog.models}
          placeholder="Ej. iPhone 14, 15 Pro…"
          compensationId={compensation?.sourceOrderId}
        />
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
        <div className="space-y-12 md:space-y-16">
          {seriesList.map((series) => (
            <ExploreSeriesSection
              key={series.key}
              series={series}
              compensationId={compensation?.sourceOrderId}
            />
          ))}
        </div>
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
