"use client";

/**
 * @file review-listing-form.tsx
 * @description ReviewListingForm component for the listings feature.tsx.
 * @dependencies react, @/features/listings/actions/listings, @/features/listings/schemas/listing, @prisma/client, @/components/ui/button
 */

import { useState, useTransition } from "react";

import {
  deleteDraftListingAction,
  submitListingForReviewAction,
} from "@/features/listings/actions/listings";
import { conditionLabels } from "@/features/listings/schemas/listing";
import type { Condition } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/price-display";

type ReviewListingFormProps = {
  listingId: string;
  title: string;
  condition: Condition;
  batteryHealth: number | null;
  price: number;
  platformFee: number | null;
  finalPrice: number | null;
  imeiLast4: string | null;
  galleryCount: number;
  hasPossessionPhoto: boolean;
  description: string | null;
};

/**
 * ReviewListingForm
 *
 * Renders the Review Listing Form UI for listings.
 *
 * @param props - ReviewListingForm props.
 * @returns ReviewListingForm React element.
 * @calledBy listings pages and parent components
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
  galleryCount,
  hasPossessionPhoto,
  description,
}: ReviewListingFormProps) {
  const [pending, startTransition] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <dl className="border-border space-y-3 rounded-xl border p-4 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">Anuncio</dt>
          <dd className="text-foreground mt-1 font-medium">{title}</dd>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-muted-foreground text-xs">Estado</dt>
            <dd className="text-foreground mt-1">
              {conditionLabels[condition]}
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
            {imeiLast4 ? `•••• ${imeiLast4}` : "Falta"}
          </dd>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-muted-foreground text-xs">Fotos</dt>
            <dd className="text-foreground mt-1">{galleryCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Posesión</dt>
            <dd className="text-foreground mt-1">
              {hasPossessionPhoto ? "Completa" : "Falta"}
            </dd>
          </div>
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
            } catch {
              // redirect
            }
          });
        }}
      >
        Enviar a revisión
      </Button>

      <Button
        type="button"
        variant="outline"
        fullWidth
        loading={deletePending}
        onClick={() => {
          startDelete(async () => {
            try {
              await deleteDraftListingAction(listingId);
            } catch {
              // redirect
            }
          });
        }}
      >
        Eliminar borrador
      </Button>
    </div>
  );
}
