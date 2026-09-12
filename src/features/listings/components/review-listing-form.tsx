"use client";

/**
 * @file review-listing-form.tsx
 * @description Pre-submit listing review with labeled photo checklist.
 * @dependencies react, next/link, listing actions, PriceDisplay, ConfirmAction
 */

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { ConfirmAction } from "@/components/confirm-action";
import { PriceDisplay } from "@/components/price-display";
import { Button } from "@/components/ui/button";
import {
  deleteDraftListingAction,
  submitListingForReviewAction,
} from "@/features/listings/actions/listings";
import { conditionLabels } from "@/features/listings/schemas/listing";
import {
  galleryImageAtOrder,
  LISTING_PHOTO_SLOTS,
} from "@/features/listings/types";
import type { Condition } from "@prisma/client";

type GalleryImage = { id: string; imageUrl: string; displayOrder: number };

type ReviewListingFormProps = {
  listingId: string;
  title: string;
  condition: Condition;
  batteryHealth: number | null;
  price: number;
  platformFee: number | null;
  finalPrice: number | null;
  imeiLast4: string | null;
  images: GalleryImage[];
  possessionPhotoUrl: string | null;
  description: string | null;
};

/**
 * ReviewSlotThumb
 *
 * Labeled gallery slot linking back to the photos step when missing.
 *
 * @param props.listingId - Draft listing id.
 * @param props.slotTitle - Guided slot title.
 * @param props.imageUrl - Saved photo, or null.
 * @returns Linked thumb.
 * @calledBy ReviewListingForm
 */
function ReviewSlotThumb({
  listingId,
  slotTitle,
  imageUrl,
}: {
  listingId: string;
  slotTitle: string;
  imageUrl: string | null;
}) {
  return (
    <Link
      href={`/vender/${listingId}/fotos`}
      className="border-border bg-muted relative block overflow-hidden rounded-lg border"
    >
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt={slotTitle}
            width={160}
            height={160}
            className="aspect-square w-full object-cover"
          />
          <span className="bg-background/80 text-foreground absolute inset-x-0 bottom-0 truncate px-1 py-0.5 text-center text-[10px]">
            {slotTitle}
          </span>
        </>
      ) : (
        <div className="flex aspect-square flex-col items-center justify-center gap-1 px-1 text-center">
          <p className="text-foreground text-[11px] font-medium">{slotTitle}</p>
          <p className="text-muted-foreground text-[10px]">Falta</p>
        </div>
      )}
    </Link>
  );
}

/**
 * ReviewListingForm
 *
 * Shows a visual listing checklist and submit/delete actions.
 *
 * @param props - Listing summary fields for the pre-submit step.
 * @returns Review listing form.
 * @calledBy `/vender/[listingId]/revisar`
 */
export function ReviewListingForm({
  listingId,
  title,
  condition,
  batteryHealth,
  price,
  platformFee,
  finalPrice,
  imeiLast4,
  images,
  possessionPhotoUrl,
  description,
}: ReviewListingFormProps) {
  const [pending, startTransition] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fotosHref = `/vender/${listingId}/fotos`;
  const dispositivoHref = `/vender/${listingId}/dispositivo`;
  const seguridadHref = `/vender/${listingId}/seguridad`;
  const posesionHref = `/vender/${listingId}/posesion`;

  return (
    <div className="grid gap-6 pb-28 md:pb-0 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div className="space-y-4">
        <dl className="border-border space-y-3 rounded-xl border p-4 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Anuncio</dt>
            <dd className="text-foreground mt-1 font-medium">
              <Link
                href={dispositivoHref}
                className="underline-offset-2 hover:underline"
              >
                {title}
              </Link>
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-muted-foreground text-xs">Estado</dt>
              <dd className="text-foreground mt-1">
                <Link
                  href={dispositivoHref}
                  className="underline-offset-2 hover:underline"
                >
                  {conditionLabels[condition]}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Batería</dt>
              <dd className="text-foreground mt-1">
                {batteryHealth != null ? `${batteryHealth}%` : "—"}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">IMEI</dt>
            <dd className="text-foreground mt-1">
              {imeiLast4 ? (
                `•••• ${imeiLast4}`
              ) : (
                <Link
                  href={seguridadHref}
                  className="text-destructive underline-offset-2 hover:underline"
                >
                  Falta
                </Link>
              )}
            </dd>
          </div>
          {description ? (
            <div>
              <dt className="text-muted-foreground text-xs">Descripción</dt>
              <dd className="text-foreground mt-1 whitespace-pre-wrap">
                {description}
              </dd>
            </div>
          ) : null}
          <PriceDisplay
            price={finalPrice ?? price}
            equipmentPrice={price}
            protectionFee={platformFee ?? undefined}
          />
        </dl>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-foreground text-sm font-semibold">Fotos</h2>
            <Link
              href={fotosHref}
              className="text-muted-foreground text-xs underline-offset-2 hover:underline"
            >
              Editar fotos
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {LISTING_PHOTO_SLOTS.map((slot, index) => (
              <ReviewSlotThumb
                key={slot.id}
                listingId={listingId}
                slotTitle={slot.title}
                imageUrl={galleryImageAtOrder(images, index)?.imageUrl ?? null}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-foreground text-sm font-semibold">Posesión</h2>
          <Link
            href={posesionHref}
            className="border-border bg-muted relative block max-w-[10rem] overflow-hidden rounded-lg border"
          >
            {possessionPhotoUrl ? (
              <>
                <Image
                  src={possessionPhotoUrl}
                  alt="Foto de posesión"
                  width={160}
                  height={160}
                  className="aspect-square w-full object-cover"
                />
                <span className="bg-background/80 text-foreground absolute inset-x-0 bottom-0 px-1 py-0.5 text-center text-[10px]">
                  Posesión
                </span>
              </>
            ) : (
              <div className="flex aspect-square flex-col items-center justify-center px-2 text-center">
                <p className="text-foreground text-xs font-medium">Posesión</p>
                <p className="text-muted-foreground text-[10px]">Falta</p>
              </div>
            )}
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Al enviar, un revisor de TruePhone validará el anuncio antes de
          publicarlo.
        </p>

        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          fullWidth
          loading={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                const result = await submitListingForReviewAction(listingId);
                if (result && result.ok === false) {
                  setError(result.error);
                }
              } catch (caught) {
                if (isRedirectError(caught)) throw caught;
              }
            });
          }}
        >
          Enviar a revisión
        </Button>

        <ConfirmAction
          idleLabel="Eliminar borrador"
          confirmLabel="Sí, eliminar borrador"
          hint="Esta acción no se puede deshacer."
          variant="outline"
          pending={deletePending}
          onConfirm={() => {
            startDelete(async () => {
              try {
                await deleteDraftListingAction(listingId);
              } catch (caught) {
                if (isRedirectError(caught)) throw caught;
              }
            });
          }}
        />
      </div>
    </div>
  );
}
