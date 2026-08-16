/**
 * @file seller-listing-summary.tsx
 * @description SellerListingSummary component for the listings feature.tsx.
 * @dependencies next/image, next/link, @prisma/client, @/components/price-display, @/components/ui/badge
 */

import Image from "next/image";
import Link from "next/link";
import type { ListingStatus } from "@prisma/client";

import { PriceDisplay } from "@/components/price-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReopenRejectedListingButton } from "@/features/listings/components/reopen-rejected-listing-button";
import {
  conditionLabels,
  listingStatusLabel,
} from "@/features/listings/schemas/listing";
import { publicListingPath } from "@/lib/listings-marketplace";
import { formatStorageLabel } from "@/lib/iphone-catalog";
import type { getOwnedListing } from "@/lib/listings";
import { prisma } from "@/lib/db";

type OwnedListing = NonNullable<Awaited<ReturnType<typeof getOwnedListing>>>;

type SellerListingSummaryProps = {
  listing: OwnedListing;
};

/**
 * statusDescription
 *
 * Supports listings by implementing statusDescription.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
function statusDescription(status: ListingStatus) {
  switch (status) {
    case "PENDING_REVIEW":
    case "SUBMITTED":
      return "Un revisor de TruePhone está validando las fotos, el IMEI y la prueba de posesión.";
    case "APPROVED":
      return "Tu anuncio fue aprobado. En TruePhone la aprobación lo deja público.";
    case "PUBLISHED":
      return "Tu anuncio está publicado y visible para compradores.";
    case "REJECTED":
      return "Tu anuncio no fue aprobado. Corrige lo indicado y vuelve a enviarlo.";
    case "RESERVED":
      return "Un comprador reservó este anuncio. Revisa el pedido en Ventas.";
    case "SOLD":
      return "Este anuncio ya fue vendido.";
    case "ARCHIVED":
      return "Este anuncio está archivado.";
    default:
      return "Estado del anuncio.";
  }
}

/**
 * getLatestOrderIdForListing
 *
 * Supports listings by implementing getLatestOrderIdForListing.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
async function getLatestOrderIdForListing(listingId: string) {
  const order = await prisma.order.findFirst({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true },
  });
  return order;
}

/**
 * SellerListingSummary
 *
 * Renders the Seller Listing Summary UI for listings.
 *
 * @param props - SellerListingSummary props.
 * @returns SellerListingSummary React element.
 * @calledBy listings pages and parent components
 */
export async function SellerListingSummary({
  listing,
}: SellerListingSummaryProps) {
  const gallery = listing.images.filter(
    (image) => image.imageType === "gallery",
  );
  const canChatReviewer =
    (listing.status === "PENDING_REVIEW" || listing.status === "REJECTED") &&
    Boolean(listing.reviewerId);
  const awaitingReviewer =
    (listing.status === "PENDING_REVIEW" ||
      listing.status === "SUBMITTED" ||
      listing.status === "REJECTED") &&
    !listing.reviewerId;
  const relatedOrder =
    listing.status === "RESERVED" || listing.status === "SOLD"
      ? await getLatestOrderIdForListing(listing.id)
      : null;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/vender">← Mis anuncios</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            {listing.title}
          </h1>
          <Badge variant="outline">{listingStatusLabel(listing.status)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {statusDescription(listing.status)}
        </p>
      </div>

      {listing.status === "REJECTED" ? (
        <aside className="border-destructive/40 bg-destructive/5 space-y-2 rounded-xl border p-4">
          <h2 className="text-foreground text-sm font-semibold">
            Motivo del rechazo
          </h2>
          <p className="text-foreground text-sm whitespace-pre-wrap">
            {listing.rejectionReason?.trim() ||
              "El revisor no dejó un detalle adicional. Revisa fotos, IMEI y posesión antes de reenviar."}
          </p>
        </aside>
      ) : null}

      {gallery.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-foreground text-sm font-semibold">Fotos</h2>
          <ul className="grid grid-cols-3 gap-2 lg:grid-cols-4">
            {gallery.map((image, index) => (
              <li
                key={image.id}
                className="bg-muted relative aspect-square overflow-hidden rounded-lg"
              >
                <Image
                  src={image.imageUrl}
                  alt={`Foto ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 30vw, 180px"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <section className="border-border space-y-3 rounded-xl border p-4 text-sm">
          <h2 className="text-foreground font-semibold">Resumen</h2>
          <dl className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
            <dt>Modelo</dt>
            <dd className="text-foreground">{listing.iphoneModel.name}</dd>
            <dt>Color</dt>
            <dd className="text-foreground">{listing.iphoneColor.name}</dd>
            <dt>Almacenamiento</dt>
            <dd className="text-foreground">
              {formatStorageLabel(listing.iphoneStorage.valueGb)}
            </dd>
            <dt>Condición</dt>
            <dd className="text-foreground">
              {conditionLabels[listing.condition]}
            </dd>
            <dt>Batería</dt>
            <dd className="text-foreground">
              {listing.batteryHealth != null
                ? `${listing.batteryHealth}%`
                : "—"}
            </dd>
            <dt>IMEI</dt>
            <dd className="text-foreground">
              {listing.imeiLast4 ? `•••• ${listing.imeiLast4}` : "—"}
            </dd>
            <dt>Liberado</dt>
            <dd className="text-foreground">
              {listing.unlocked ? "Sí" : "No"}
              {listing.carrier ? ` · ${listing.carrier}` : ""}
            </dd>
            <dt>Accesorios</dt>
            <dd className="text-foreground">
              {[
                listing.hasBox ? "Caja" : null,
                listing.hasCharger ? "Cargador" : null,
                listing.hasReceipt ? "Factura" : null,
              ]
                .filter(Boolean)
                .join(", ") || "Ninguno"}
            </dd>
          </dl>
          {listing.description ? (
            <div className="space-y-1">
              <p className="text-foreground font-medium">Descripción</p>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          ) : null}
          <PriceDisplay
            price={listing.finalPrice ?? listing.price}
            equipmentPrice={listing.price}
            protectionFee={listing.platformFee ?? undefined}
            className="[&>p]:text-lg"
          />
        </section>

        <div className="space-y-2">
          {listing.status === "PUBLISHED" && listing.slug ? (
            <Button fullWidth asChild>
              <Link href={publicListingPath(listing.slug)}>
                Ver anuncio público
              </Link>
            </Button>
          ) : null}

          {relatedOrder ? (
            <Button fullWidth asChild>
              <Link href={`/ventas/${relatedOrder.id}`}>Ver pedido</Link>
            </Button>
          ) : null}

          {listing.status === "REJECTED" ? (
            <ReopenRejectedListingButton listingId={listing.id} />
          ) : null}

          {canChatReviewer ? (
            <Button fullWidth variant="outline" asChild>
              <Link href={`/mensajes/${listing.id}`}>Chat con revisor</Link>
            </Button>
          ) : null}

          {awaitingReviewer ? (
            <div className="space-y-1">
              <Button fullWidth variant="outline" disabled>
                Chat con revisor
              </Button>
              <p className="text-muted-foreground text-center text-xs">
                Podrás escribirle cuando un revisor tome tu anuncio.
              </p>
            </div>
          ) : null}

          <Button fullWidth variant="outline" asChild>
            <Link href="/vender">Volver a mis anuncios</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
