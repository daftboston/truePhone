/**
 * @file page.tsx
 * @description Side-by-side iPhone model comparison for active catalog models.
 * @dependencies AppShell, CompareModelsShell, getCatalog, iphone-catalog-specs
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { CompareModelsShell } from "@/features/listings/components/compare-models-shell";
import { IPHONE_CATALOG_MODELS } from "@/lib/iphone-catalog-data";
import { getCatalogModelSpecs } from "@/lib/iphone-catalog-specs";
import { getCatalog } from "@/lib/listings";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Catalog is live DB data; skip build-time prerender (CI has no Postgres). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comparar iPhones",
  description:
    "Compara modelos de iPhone lado a lado: pantalla, batería, chip, cámaras y más.",
};

/**
 * resolveCompareSlug
 *
 * Normalizes a compare query param to a single slug string.
 *
 * @param value - Raw search param value.
 * @returns Slug string or empty when absent.
 */
function resolveCompareSlug(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  return "";
}

/**
 * ComparePage
 *
 * Renders model pickers and a hardware comparison for two active catalog models.
 *
 * @returns Compare page with optional shareable query params.
 */
export default async function ComparePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialLeftSlug = resolveCompareSlug(params.a);
  const initialRightSlug = resolveCompareSlug(params.b);
  const catalog = await getCatalog();

  const compareModels = catalog.models
    .map((model) => {
      const seed = IPHONE_CATALOG_MODELS.find(
        (entry) => entry.slug === model.slug,
      );
      const specs = getCatalogModelSpecs(model.slug);
      if (!seed || !specs) return null;

      return {
        slug: model.slug,
        name: model.name,
        entry: {
          name: model.name,
          specs,
          storageGb: seed.storageGb,
          releaseYear: model.releaseYear ?? seed.releaseYear,
        },
      };
    })
    .filter((model): model is NonNullable<typeof model> => model !== null);

  const validSlugs = new Set(compareModels.map((model) => model.slug));
  const leftSlug = validSlugs.has(initialLeftSlug) ? initialLeftSlug : "";
  const rightSlug = validSlugs.has(initialRightSlug) ? initialRightSlug : "";

  return (
    <AppShell mainClassName="gap-6 md:gap-8">
      <div className="space-y-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/explorar" className="inline-flex items-center gap-1">
            <ChevronLeft className="size-4" aria-hidden />
            Explorar modelos
          </Link>
        </Button>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          Comparar iPhones
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Elige dos modelos para ver sus especificaciones lado a lado.
        </p>
      </div>

      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm">Cargando comparación…</p>
        }
      >
        <CompareModelsShell
          models={compareModels}
          initialLeftSlug={leftSlug}
          initialRightSlug={rightSlug}
        />
      </Suspense>
    </AppShell>
  );
}
