/**
 * @file page.tsx
 * @description Public listing detail page for a published anuncio slug.
 * @dependencies Listing gallery, price, seller, order/favorite actions, public Q&A, listing views
 */

import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { GuaranteeBanner } from "@/components/guarantee-banner";
import { ListingCard } from "@/components/listing-card";
import { ListingGallery } from "@/components/listing-gallery";
import { PriceDisplay } from "@/components/price-display";
import { SellerCard } from "@/components/seller-card";
import { TrustBadge } from "@/components/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingQaSection } from "@/features/listing-qa/components/listing-qa-section";
import { ListingPurchaseActions } from "@/features/listings/components/listing-purchase-actions";
import { RecordRecentlyViewed } from "@/features/listings/components/record-recently-viewed";
import { CompensationBanner } from "@/features/orders/components/compensation-banner";
import { conditionLabels } from "@/features/listings/schemas/listing";
import { formatSellerRating } from "@/features/profile/types";
import { isSellerIdentityVerified } from "@/features/verification/types";
import {
  canAccessReviewPortal,
  getAuthUser,
  getCurrentProfile,
} from "@/lib/auth/session";
import { isListingFavorited } from "@/lib/favorites";
import { findActiveFeeEntitlementForSource } from "@/lib/financial-core/entitlements";
import {
  computeOrderFees,
  LOYALTY_FEE_RATE_BPS,
} from "@/lib/financial-core/fees";
import { formatStorageLabel } from "@/lib/iphone-catalog";
import {
  getPublishedListingBySlug,
  listRelatedPublishedListings,
  marketplaceSellerName,
  primaryGalleryUrl,
  publicListingPath,
} from "@/lib/listings-marketplace";
import { listingViewRequestMeta, recordListingView } from "@/lib/listing-views";
import { getActiveOrderForBuyerOnListing } from "@/lib/orders";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getPublishedListingBySlug(slug);

  if (!listing) {
    return { title: "Anuncio no encontrado" };
  }

  const price = listing.finalPrice ?? listing.price;
  const description =
    listing.description?.trim() ||
    `${listing.iphoneModel.name} · ${formatStorageLabel(listing.iphoneStorage.valueGb)} · ${listing.iphoneColor.name}. Revisado en TruePhone.`;

  return {
    title: listing.title,
    description,
    openGraph: {
      title: listing.title,
      description,
      images: listing.images[0]?.imageUrl
        ? [{ url: listing.images[0].imageUrl }]
        : undefined,
    },
    other: {
      "product:price:amount": String(price),
      "product:price:currency": "COP",
    },
  };
}

/**
 * PublicListingPage
 *
 * Loads a published listing by slug and composes the buyer-facing detail view.
 *
 * @returns Public listing detail page or notFound.
 */
export default async function PublicListingPage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, queryParams] = await Promise.all([params, searchParams]);
  const requestedCompensation =
    typeof queryParams.compensacion === "string"
      ? queryParams.compensacion
      : "";
  const listing = await getPublishedListingBySlug(slug);

  if (!listing) notFound();

  const [user, current, headerStore] = await Promise.all([
    getAuthUser(),
    getCurrentProfile(),
    headers(),
  ]);
  const viewMeta = listingViewRequestMeta(headerStore);
  await recordListingView({
    listingId: listing.id,
    sellerId: listing.sellerId,
    viewerId: current?.profile.id ?? null,
    ip: viewMeta.ip,
    userAgent: viewMeta.userAgent,
  });
  const favorited = current
    ? await isListingFavorited(current.profile.id, listing.id)
    : false;
  const pendingOrder =
    current && current.profile.id !== listing.sellerId
      ? await getActiveOrderForBuyerOnListing(listing.id, current.profile.id)
      : null;
  const compensation =
    current && requestedCompensation
      ? await findActiveFeeEntitlementForSource(
          current.profile.id,
          requestedCompensation,
        )
      : null;
  const compensationFees = compensation
    ? computeOrderFees({
        salePrice: listing.price,
        feeRateBps: LOYALTY_FEE_RATE_BPS,
      })
    : null;
  const related = await listRelatedPublishedListings(listing);
  const gallery = listing.images.filter(
    (image) => image.imageType === "gallery",
  );
  const sellerName = marketplaceSellerName(listing.seller);
  const sellerVerified =
    listing.seller.isTrustedSeller ||
    isSellerIdentityVerified(listing.seller.verifikStatus);
  const sellerLocation = [listing.seller.city, listing.seller.department]
    .filter(Boolean)
    .join(", ");
  const sellerSubtitle = [
    sellerLocation ? `Vendedor en ${sellerLocation}` : null,
    formatSellerRating(listing.seller.sellerRating),
    listing.seller.totalSales > 0
      ? `${listing.seller.totalSales} venta${listing.seller.totalSales === 1 ? "" : "s"}`
      : null,
    listing.seller.totalReviews > 0
      ? `${listing.seller.totalReviews} reseña${listing.seller.totalReviews === 1 ? "" : "s"}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const accessories = [
    listing.hasBox ? "Caja" : null,
    listing.hasCharger ? "Cargador" : null,
    listing.hasReceipt ? "Factura" : null,
  ].filter(Boolean);

  const loginHref = `/login?next=${encodeURIComponent(publicListingPath(listing.slug))}`;
  const qaLoginHref = `/login?next=${encodeURIComponent(`${publicListingPath(listing.slug)}#preguntas`)}`;
  const messageLoginHref = `/login?next=${encodeURIComponent(`/mensajes/${listing.id}`)}`;
  const sellerHref = listing.seller.username
    ? `/u/${listing.seller.username}`
    : null;
  const isOwnListing = current?.profile.id === listing.sellerId;

  return (
    <AppShell className="pb-40 md:pb-0" mainClassName="gap-8 md:gap-10">
      <RecordRecentlyViewed slug={listing.slug} title={listing.title} />
      {compensation ? (
        <CompensationBanner sourceOrderId={compensation.sourceOrderId} />
      ) : null}
      <div className="space-y-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/buscar?model=${listing.iphoneModelId}`}>
            ← Volver a {listing.iphoneModel.name}
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-10">
        <ListingGallery images={gallery} alt={listing.title} />

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
              {listing.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {conditionLabels[listing.condition]}
              </Badge>
              <TrustBadge label="Revisado" />
              {listing.batteryHealth != null ? (
                <Badge variant="outline">
                  Batería {listing.batteryHealth}%
                </Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground text-sm">
              {listing.iphoneModel.name} ·{" "}
              {formatStorageLabel(listing.iphoneStorage.valueGb)} ·{" "}
              {listing.iphoneColor.name}
            </p>
          </div>

          <PriceDisplay
            price={
              compensationFees?.buyerTotal ??
              listing.finalPrice ??
              listing.price
            }
            equipmentPrice={listing.price}
            protectionFee={
              compensationFees?.platformFee ?? listing.platformFee ?? undefined
            }
            protectionLabel={
              compensationFees
                ? "Protección TruePhone 8% por compensación"
                : undefined
            }
          />

          <GuaranteeBanner />

          {sellerHref ? (
            <Link href={sellerHref} className="block">
              <SellerCard
                name={sellerName}
                avatarUrl={listing.seller.avatarUrl ?? undefined}
                verified={sellerVerified}
                subtitle={sellerSubtitle || undefined}
              />
            </Link>
          ) : (
            <SellerCard
              name={sellerName}
              avatarUrl={listing.seller.avatarUrl ?? undefined}
              verified={sellerVerified}
              subtitle={sellerSubtitle || undefined}
            />
          )}

          <ListingPurchaseActions
            className="hidden md:block"
            listingId={listing.id}
            listingTitle={listing.title}
            publicPath={publicListingPath(listing.slug)}
            loginHref={loginHref}
            messageHref={`/mensajes/${listing.id}`}
            messageLoginHref={messageLoginHref}
            isOwnListing={isOwnListing}
            isAuthenticated={Boolean(user)}
            pendingOrderId={pendingOrder?.id ?? null}
            favorited={favorited}
          />
        </div>
      </div>

      <section className="border-border space-y-4 rounded-2xl border p-4 md:p-6">
        <h2 className="text-foreground text-lg font-semibold">
          Especificaciones
        </h2>
        <dl className="text-muted-foreground grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4 sm:block sm:space-y-1">
            <dt>Modelo</dt>
            <dd className="text-foreground font-medium">
              {listing.iphoneModel.name}
            </dd>
          </div>
          <div className="flex justify-between gap-4 sm:block sm:space-y-1">
            <dt>Almacenamiento</dt>
            <dd className="text-foreground font-medium">
              {formatStorageLabel(listing.iphoneStorage.valueGb)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 sm:block sm:space-y-1">
            <dt>Color</dt>
            <dd className="text-foreground font-medium">
              {listing.iphoneColor.name}
            </dd>
          </div>
          <div className="flex justify-between gap-4 sm:block sm:space-y-1">
            <dt>Condición</dt>
            <dd className="text-foreground font-medium">
              {conditionLabels[listing.condition]}
            </dd>
          </div>
          <div className="flex justify-between gap-4 sm:block sm:space-y-1">
            <dt>Batería</dt>
            <dd className="text-foreground font-medium">
              {listing.batteryHealth != null
                ? `${listing.batteryHealth}%`
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 sm:block sm:space-y-1">
            <dt>Liberado</dt>
            <dd className="text-foreground font-medium">
              {listing.unlocked ? "Sí" : "No"}
              {listing.carrier ? ` · ${listing.carrier}` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-4 sm:block sm:space-y-1">
            <dt>Activation Lock</dt>
            <dd className="text-foreground font-medium">
              {listing.activationLocked ? "Activado" : "Desactivado"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 sm:block sm:space-y-1">
            <dt>Accesorios</dt>
            <dd className="text-foreground font-medium">
              {accessories.length > 0 ? accessories.join(", ") : "Ninguno"}
            </dd>
          </div>
        </dl>
      </section>

      {listing.description ? (
        <section className="space-y-2">
          <h2 className="text-foreground text-lg font-semibold">Descripción</h2>
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {listing.description}
          </p>
        </section>
      ) : null}

      <ListingQaSection
        listingId={listing.id}
        listingStatus={listing.status}
        sellerId={listing.sellerId}
        viewer={{
          profileId: current?.profile.id ?? null,
          isStaff: current
            ? canAccessReviewPortal(current.profile.role)
            : false,
        }}
        isAuthenticated={Boolean(user)}
        loginHref={qaLoginHref}
      />

      {related.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-foreground text-lg font-semibold">
            Más {listing.iphoneModel.name}
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {related.map((item) => (
              <ListingCard
                key={item.id}
                href={publicListingPath(item.slug)}
                title={item.title}
                imageUrl={primaryGalleryUrl(item)}
                price={item.finalPrice ?? item.price}
                batteryHealth={item.batteryHealth ?? undefined}
                verified
                conditionLabel={conditionLabels[item.condition]}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="bg-background/95 border-border fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t px-4 py-3 md:hidden">
        <ListingPurchaseActions
          compact
          listingId={listing.id}
          listingTitle={listing.title}
          publicPath={publicListingPath(listing.slug)}
          loginHref={loginHref}
          messageHref={`/mensajes/${listing.id}`}
          messageLoginHref={messageLoginHref}
          isOwnListing={isOwnListing}
          isAuthenticated={Boolean(user)}
          pendingOrderId={pendingOrder?.id ?? null}
          favorited={favorited}
        />
      </div>
    </AppShell>
  );
}
