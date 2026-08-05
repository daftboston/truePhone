/**
 * @file page.tsx
 * @description Detail view for reviewing a single listing submission.
 * @dependencies Listing review actions and media viewers
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PriceDisplay } from "@/components/price-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingReviewActions } from "@/features/listings/components/listing-review-actions";
import {
  conditionLabels,
  listingStatusLabel,
} from "@/features/listings/schemas/listing";
import { claimListingForReviewAction } from "@/features/listings/actions/review";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  findPossibleDuplicateListings,
  getListingForReview,
  isEditableReviewStatus,
  sellerDisplayName,
} from "@/lib/listings-review";

type PageProps = {
  params: Promise<{ listingId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { listingId } = await params;
  const listing = await getListingForReview(listingId);
  return {
    title: listing ? `Revisar · ${listing.title}` : "Revisar anuncio",
  };
}

/**
 * ListingReviewDetailPage
 *
 * Lets a reviewer inspect and approve/reject a listing.
 *
 * @returns Listing review detail page.
 */
export default async function ListingReviewDetailPage({ params }: PageProps) {
  const { listingId } = await params;
  const current = await getCurrentProfile();
  if (!current) redirect(`/login?next=/revision/anuncios/${listingId}`);

  if (current.profile.role !== "REVIEWER" && current.profile.role !== "ADMIN") {
    return (
      <AppShell mainClassName="max-w-lg justify-center">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden revisar anuncios."
          action={
            <Button asChild variant="outline">
              <Link href="/">Volver al inicio</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  let listing = await getListingForReview(listingId);
  if (!listing) notFound();

  if (listing.status === "PENDING_REVIEW" && !listing.reviewerId) {
    await claimListingForReviewAction(listing.id);
    listing = (await getListingForReview(listingId)) ?? listing;
  }

  const duplicates =
    listing.status === "PENDING_REVIEW"
      ? await findPossibleDuplicateListings(listing)
      : [];

  const gallery = listing.images.filter(
    (image) => image.imageType === "gallery",
  );
  const possession =
    listing.images.find((image) => image.imageType === "possession") ??
    (listing.possessionChallenge?.photoUrl
      ? {
          id: "possession",
          imageUrl: listing.possessionChallenge.photoUrl,
        }
      : null);

  const canEditDecision = isEditableReviewStatus(listing.status);

  return (
    <AppShell mainClassName="max-w-lg gap-6">
      <div className="space-y-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/revision/anuncios">← Volver a la cola</Link>
        </Button>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          {listing.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{listingStatusLabel(listing.status)}</Badge>
          {listing.reviewer ? (
            <span className="text-muted-foreground text-xs">
              Asignado a{" "}
              {listing.reviewer.fullName ??
                (listing.reviewer.username
                  ? `@${listing.reviewer.username}`
                  : "revisor")}
            </span>
          ) : null}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">Fotos</h2>
        {gallery.length === 0 && !possession ? (
          <p className="text-muted-foreground text-sm">Sin imágenes.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gallery.map((image, index) => (
              <a
                key={image.id}
                href={image.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-muted relative aspect-square overflow-hidden rounded-lg"
              >
                <Image
                  src={image.imageUrl}
                  alt={`Foto ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </a>
            ))}
            {possession ? (
              <a
                href={possession.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-muted relative aspect-square overflow-hidden rounded-lg"
              >
                <Image
                  src={possession.imageUrl}
                  alt="Posesión"
                  fill
                  className="object-cover"
                  sizes="160px"
                />
                <span className="bg-background/80 text-foreground absolute inset-x-0 bottom-0 px-1 py-0.5 text-center text-[10px]">
                  Posesión
                  {listing.possessionChallenge?.code
                    ? ` · ${listing.possessionChallenge.code}`
                    : ""}
                </span>
              </a>
            ) : null}
          </div>
        )}
      </section>

      <section className="border-border space-y-3 rounded-xl border p-4 text-sm">
        <h2 className="text-foreground font-semibold">Detalle del anuncio</h2>
        <dl className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
          <dt>Vendedor</dt>
          <dd className="text-foreground">
            {sellerDisplayName(listing.seller)}
            {listing.seller.city ? ` · ${listing.seller.city}` : ""}
          </dd>
          <dt>Modelo</dt>
          <dd className="text-foreground">{listing.iphoneModel.name}</dd>
          <dt>Color</dt>
          <dd className="text-foreground">{listing.iphoneColor.name}</dd>
          <dt>Almacenamiento</dt>
          <dd className="text-foreground">
            {listing.iphoneStorage.valueGb} GB
          </dd>
          <dt>Condición</dt>
          <dd className="text-foreground">
            {conditionLabels[listing.condition]}
          </dd>
          <dt>Batería</dt>
          <dd className="text-foreground">
            {listing.batteryHealth != null ? `${listing.batteryHealth}%` : "—"}
          </dd>
          <dt>IMEI</dt>
          <dd className="text-foreground">
            •••• {listing.imeiLast4 ?? "????"}
          </dd>
          <dt>Activation Lock</dt>
          <dd className="text-foreground">
            {listing.activationLocked ? "Activado" : "Desactivado"}
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
          <dt>Precio</dt>
          <dd>
            <PriceDisplay
              price={listing.finalPrice ?? listing.price}
              equipmentPrice={listing.price}
              protectionFee={listing.platformFee ?? undefined}
              className="[&>p]:text-sm"
            />
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
      </section>

      {duplicates.length > 0 ? (
        <section className="border-warning/40 bg-warning/5 space-y-2 rounded-xl border p-4">
          <h2 className="text-foreground text-sm font-semibold">
            Posibles duplicados
          </h2>
          <ul className="space-y-1 text-sm">
            {duplicates.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/revision/anuncios/${item.id}`}
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  {item.title}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  · {listingStatusLabel(item.status)}
                  {item.imeiLast4 ? ` · IMEI •••• ${item.imeiLast4}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {canEditDecision ? (
        <ListingReviewActions
          listingId={listing.id}
          status={listing.status}
          initialNotes={listing.reviewerNotes}
          initialRejectionReason={listing.rejectionReason}
        />
      ) : (
        <div className="border-border space-y-2 rounded-xl border p-4 text-sm">
          <p className="text-foreground font-semibold">
            Este anuncio no está en el historial de revisión editable
          </p>
          {listing.rejectionReason ? (
            <p className="text-muted-foreground">
              Motivo: {listing.rejectionReason}
            </p>
          ) : null}
          {listing.reviewerNotes ? (
            <p className="text-muted-foreground">
              Notas: {listing.reviewerNotes}
            </p>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
