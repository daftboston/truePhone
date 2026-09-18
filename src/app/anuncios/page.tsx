/**
 * @file page.tsx
 * @description All published listings feed — newest first, any model.
 * @dependencies BrowseFilters, ListingCard, listings marketplace cursor helpers
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { FeedPagination } from "@/components/feed-pagination";
import { GuaranteeBanner } from "@/components/guarantee-banner";
import { ListingCard } from "@/components/listing-card";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { BrowseFilters } from "@/features/listings/components/browse-filters";
import { BrowseFiltersSheet } from "@/features/listings/components/browse-filters-sheet";
import { LandingPreferenceRecorder } from "@/features/listings/components/landing-preference-sync";
import { CompensationBanner } from "@/features/orders/components/compensation-banner";
import {
  ANUNCIOS_PAGE_SIZE,
  buildAnunciosHref,
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
  decodePublishedListingCursor,
  encodePublishedListingCursor,
  listPublishedListingsByCursor,
  primaryGalleryUrl,
  publicListingPath,
} from "@/lib/listings-marketplace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Anuncios",
  description:
    "Todos los anuncios de iPhone revisados en TruePhone, del más reciente al más antiguo.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * AnunciosFeedPage
 *
 * Renders every published listing with shared browse filters and cursor pagination.
 *
 * @returns All-listings feed page.
 */
export default async function AnunciosFeedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsedQuery = parseBrowseSearchParams(params);
  const session = await getCurrentProfile();
  const compensation =
    session && parsedQuery.compensationId
      ? await findActiveFeeEntitlementForSource(
          session.profile.id,
          parsedQuery.compensationId,
        )
      : null;
  const query = {
    ...parsedQuery,
    sort: "newest" as const,
    page: 1,
    compensationId: compensation?.sourceOrderId ?? "",
  };

  const catalog = await getCatalog();
  const selectedModel = query.modelId
    ? catalog.models.find((model) => model.id === query.modelId)
    : null;

  if (query.modelId && !selectedModel) {
    redirect(buildAnunciosHref({ ...query, modelId: "", seriesKey: "" }));
  }

  const seriesModels = query.seriesKey
    ? catalog.models.filter(
        (model) => getModelSeriesKey(model).key === query.seriesKey,
      )
    : [];

  if (query.seriesKey && !query.modelId && seriesModels.length === 0) {
    redirect(buildAnunciosHref({ ...query, seriesKey: "" }));
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
        : "Todos los anuncios";

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
  };

  const cursor = decodePublishedListingCursor(query.cursor);
  const before = decodePublishedListingCursor(query.before);

  const [total, page] = await Promise.all([
    countPublishedListings(filterOptions),
    listPublishedListingsByCursor({
      ...filterOptions,
      take: ANUNCIOS_PAGE_SIZE,
      cursor,
      before,
    }),
  ]);

  const hasActiveFilters = Boolean(
    query.q ||
    query.modelId ||
    query.seriesKey ||
    query.storageId ||
    query.condition ||
    query.price,
  );

  const clearHref = buildAnunciosHref({
    ...query,
    q: "",
    modelId: "",
    seriesKey: "",
    storageId: "",
    condition: "",
    price: "",
    cursor: "",
    before: "",
  });

  const nextHref = page.nextCursor
    ? buildAnunciosHref(query, {
        cursor: encodePublishedListingCursor(page.nextCursor),
        before: "",
      })
    : null;

  const prevHref = page.prevCursor
    ? buildAnunciosHref(query, {
        before: encodePublishedListingCursor(page.prevCursor),
        cursor: "",
      })
    : query.cursor || query.before
      ? buildAnunciosHref(query, { cursor: "", before: "" })
      : null;

  return (
    <AppShell mainClassName="gap-6">
      <LandingPreferenceRecorder
        preference="ANUNCIOS"
        isAuthenticated={Boolean(session)}
      />

      {compensation ? (
        <CompensationBanner sourceOrderId={compensation.sourceOrderId} />
      ) : null}

      <div className="space-y-2">
        <h1 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
          {heading}
        </h1>
        <p className="text-muted-foreground text-sm">
          Todos los iPhones revisados y publicados, ordenados del más reciente
          al más antiguo.
        </p>
        <GuaranteeBanner />
      </div>

      <SearchBar
        action="/anuncios"
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
        <BrowseFiltersSheet key={JSON.stringify({ ...query, cursor, before })}>
          <BrowseFilters
            query={{ ...query, cursor: query.cursor, before: query.before }}
            models={sidebarModels}
            storages={sidebarStorages}
            basePath="/anuncios"
            lockNewestSort
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

          {page.listings.length === 0 ? (
            <EmptyState
              title={
                hasActiveFilters
                  ? "No hay anuncios con estos filtros"
                  : "Aún no hay anuncios publicados"
              }
              description={
                hasActiveFilters
                  ? "Prueba otra combinación o limpia los filtros."
                  : "Cuando un revisor apruebe un iPhone, aparecerá aquí."
              }
              action={
                hasActiveFilters ? (
                  <Button asChild variant="outline">
                    <Link href={clearHref}>Limpiar filtros</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link href="/explorar">Explorar modelos</Link>
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
                {page.listings.map((listing) => (
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

              <FeedPagination prevHref={prevHref} nextHref={nextHref} />
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
