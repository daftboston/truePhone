/**
 * @file page.tsx
 * @description Full-text/filter search results for marketplace listings.
 * @dependencies SearchBar, ListingCard, Pagination, listings search helpers
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { BrowseFilters } from "@/features/listings/components/browse-filters";
import { BrowseFiltersSheet } from "@/features/listings/components/browse-filters-sheet";
import { CompensationBanner } from "@/features/orders/components/compensation-banner";
import { SearchBar } from "@/components/search-bar";
import {
  BROWSE_PAGE_SIZE,
  buildBrowseHref,
  hasBrowseScope,
  parseBrowseSearchParams,
  priceBandBounds,
} from "@/features/listings/schemas/browse";
import { conditionLabels } from "@/features/listings/schemas/listing";
import { getCurrentProfile } from "@/lib/auth/session";
import { findActiveFeeEntitlementForSource } from "@/lib/financial-core/entitlements";
import { getModelSeriesKey } from "@/lib/iphone-catalog";
import { getCatalog } from "@/lib/listings";
import {
  countPublishedListings,
  listPublishedListings,
  primaryGalleryUrl,
  publicListingPath,
} from "@/lib/listings-marketplace";

export const metadata: Metadata = {
  title: "Anuncios",
  description: "Anuncios de iPhone revisados en TruePhone.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * SearchPage
 *
 * Runs listing search from query params and renders paginated results.
 *
 * @returns Search results page.
 */
export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsedQuery = parseBrowseSearchParams(params);
  const current = parsedQuery.compensationId ? await getCurrentProfile() : null;
  const compensation =
    current && parsedQuery.compensationId
      ? await findActiveFeeEntitlementForSource(
          current.profile.id,
          parsedQuery.compensationId,
        )
      : null;
  const query = {
    ...parsedQuery,
    compensationId: compensation?.sourceOrderId ?? "",
  };

  if (!hasBrowseScope(query)) {
    redirect("/explorar");
  }

  const catalog = await getCatalog();
  const selectedModel = query.modelId
    ? catalog.models.find((model) => model.id === query.modelId)
    : null;

  if (query.modelId && !selectedModel) {
    redirect("/explorar");
  }

  const seriesModels = query.seriesKey
    ? catalog.models.filter(
        (model) => getModelSeriesKey(model).key === query.seriesKey,
      )
    : [];

  if (query.seriesKey && !query.modelId && seriesModels.length === 0) {
    redirect("/explorar");
  }

  const sidebarModels = selectedModel
    ? catalog.models.filter(
        (model) =>
          getModelSeriesKey(model).key === getModelSeriesKey(selectedModel).key,
      )
    : seriesModels.length > 0
      ? seriesModels
      : catalog.models;

  const heading = selectedModel
    ? selectedModel.name
    : seriesModels[0]
      ? getModelSeriesKey(seriesModels[0]).label
      : query.q
        ? `Resultados para “${query.q}”`
        : "Anuncios";

  const sidebarStorageIds = new Set(
    sidebarModels.flatMap(
      (model) => catalog.storageIdsByModelId[model.id] ?? [],
    ),
  );
  const sidebarStorages =
    sidebarStorageIds.size > 0
      ? catalog.storages.filter((storage) => sidebarStorageIds.has(storage.id))
      : catalog.storages;
  const { minPrice, maxPrice } = priceBandBounds(query.price);
  const filterOptions = {
    q: query.q || undefined,
    modelId: query.modelId || undefined,
    modelIds: !query.modelId
      ? seriesModels.map((model) => model.id)
      : undefined,
    storageId: query.storageId || undefined,
    condition: query.condition || undefined,
    minPrice,
    maxPrice,
    orderBy: query.sort,
  };

  const [total, listings] = await Promise.all([
    countPublishedListings(filterOptions),
    listPublishedListings({
      ...filterOptions,
      take: BROWSE_PAGE_SIZE,
      skip: (query.page - 1) * BROWSE_PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / BROWSE_PAGE_SIZE));
  const page = Math.min(query.page, totalPages);
  const pageListings =
    page === query.page
      ? listings
      : await listPublishedListings({
          ...filterOptions,
          take: BROWSE_PAGE_SIZE,
          skip: (page - 1) * BROWSE_PAGE_SIZE,
        });

  const hasActiveFilters = Boolean(
    query.q || query.storageId || query.condition || query.price,
  );

  const clearHref = buildBrowseHref(
    { ...query, q: "", storageId: "", condition: "", price: "", page: 1 },
    {},
  );

  return (
    <AppShell mainClassName="gap-6">
      {compensation ? (
        <CompensationBanner sourceOrderId={compensation.sourceOrderId} />
      ) : null}

      <div className="space-y-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/explorar">← Explorar modelos</Link>
        </Button>
        <h1 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
          {heading}
        </h1>
        <p className="text-muted-foreground text-sm">
          Solo anuncios revisados y publicados por TruePhone.
        </p>
      </div>

      <SearchBar
        defaultValue={query.q}
        placeholder="Buscar por modelo, color o título…"
        hiddenFields={{
          ...(query.modelId ? { model: query.modelId } : {}),
          ...(query.seriesKey && !query.modelId
            ? { series: query.seriesKey }
            : {}),
          ...(query.compensationId
            ? { compensacion: query.compensationId }
            : {}),
        }}
      />

      <div className="grid gap-6 md:grid-cols-[200px_1fr] md:items-start lg:grid-cols-[220px_1fr]">
        <BrowseFiltersSheet>
          <BrowseFilters
            query={{ ...query, page }}
            models={sidebarModels}
            storages={sidebarStorages}
            className="border-border max-h-[calc(100vh-7rem)] overflow-y-auto md:sticky md:top-20 md:rounded-xl md:border md:p-3"
          />
        </BrowseFiltersSheet>

        <div className="space-y-4">
          <div className="text-muted-foreground flex items-center justify-between gap-3 text-sm">
            <p>
              {total === 0
                ? "Sin resultados"
                : `${total} anuncio${total === 1 ? "" : "s"}`}
            </p>
            {hasActiveFilters ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={clearHref}>Limpiar filtros</Link>
              </Button>
            ) : null}
          </div>

          {pageListings.length === 0 ? (
            <EmptyState
              title={
                hasActiveFilters
                  ? "No hay anuncios con estos filtros"
                  : query.q && !query.modelId && !query.seriesKey
                    ? "No hay anuncios para esa búsqueda"
                    : "Aún no hay anuncios de este modelo"
              }
              description={
                hasActiveFilters
                  ? "Prueba otra combinación o limpia los filtros."
                  : query.q && !query.modelId && !query.seriesKey
                    ? "Prueba otro término o explora el catálogo por modelo."
                    : "Cuando un revisor apruebe un anuncio, aparecerá aquí."
              }
              action={
                hasActiveFilters ? (
                  <Button asChild variant="outline">
                    <Link href={clearHref}>Limpiar filtros</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link href="/explorar">Ver otros modelos</Link>
                  </Button>
                )
              }
              secondaryAction={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/ayuda">Preguntas frecuentes</Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 lg:gap-4">
                {pageListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    href={`${publicListingPath(listing.slug)}${query.compensationId ? `?compensacion=${encodeURIComponent(query.compensationId)}` : ""}`}
                    title={listing.title}
                    imageUrl={primaryGalleryUrl(listing)}
                    price={listing.finalPrice ?? listing.price}
                    batteryHealth={listing.batteryHealth ?? undefined}
                    conditionLabel={conditionLabels[listing.condition]}
                    verified
                  />
                ))}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                prevHref={
                  page > 1 ? buildBrowseHref(query, { page: page - 1 }) : null
                }
                nextHref={
                  page < totalPages
                    ? buildBrowseHref(query, { page: page + 1 })
                    : null
                }
              />
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
