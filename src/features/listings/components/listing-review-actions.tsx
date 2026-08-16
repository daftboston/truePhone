"use client";

/**
 * @file listing-review-actions.tsx
 * @description ListingReviewActions component for the listings feature.tsx.
 * @dependencies react, @/features/listings/actions/review, @/features/listings/schemas/review, @/features/listings/types, @/components/ui/button
 */

import { useActionState, useState } from "react";

import {
  approveListingAction,
  rejectListingAction,
  saveListingReviewNotesAction,
} from "@/features/listings/actions/review";
import { LISTING_QUALITY_CHECKLIST } from "@/features/listings/schemas/review";
import type { ListingActionState } from "@/features/listings/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ListingReviewActionsProps = {
  listingId: string;
  status: string;
  initialNotes: string | null;
  initialRejectionReason: string | null;
};

/**
 * ListingReviewActions
 *
 * Renders the Listing Review Actions UI for listings.
 *
 * @param props - ListingReviewActions props.
 * @returns ListingReviewActions React element.
 * @calledBy listings pages and parent components
 */
export function ListingReviewActions({
  listingId,
  status,
  initialNotes,
  initialRejectionReason,
}: ListingReviewActionsProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const isApproved = status === "PUBLISHED" || status === "APPROVED";
  const isRejected = status === "REJECTED";
  const isPending = status === "PENDING_REVIEW" || status === "SUBMITTED";

  const [notesState, notesAction, notesPending] = useActionState<
    ListingActionState,
    FormData
  >(saveListingReviewNotesAction, null);

  const [approveState, approveAction, approvePending] = useActionState<
    ListingActionState,
    FormData
  >(approveListingAction, null);

  const [rejectState, rejectAction, rejectPending] = useActionState<
    ListingActionState,
    FormData
  >(rejectListingAction, null);

  return (
    <div className="border-border space-y-5 rounded-xl border p-4">
      {!isPending ? (
        <p className="text-muted-foreground text-xs">
          Ya revisado. Puedes corregir notas o cambiar la decisión si olvidaste
          algo.
        </p>
      ) : null}

      <div className="space-y-3">
        <p className="text-foreground text-sm font-semibold">
          Lista de calidad
        </p>
        <p className="text-muted-foreground text-xs">
          Úsala como guía. No bloquea la aprobación.
        </p>
        <ul className="space-y-2">
          {LISTING_QUALITY_CHECKLIST.map((item, index) => (
            <li key={item}>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="border-border mt-0.5 size-4 rounded"
                  checked={Boolean(checked[index])}
                  onChange={(event) =>
                    setChecked((prev) => ({
                      ...prev,
                      [index]: event.target.checked,
                    }))
                  }
                />
                <span className="text-foreground">{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`notes-${listingId}`}>Notas internas</Label>
        <Textarea
          id={`notes-${listingId}`}
          name="reviewerNotes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Solo visible para revisores"
          rows={3}
        />
      </div>

      <form action={notesAction}>
        <input type="hidden" name="listingId" value={listingId} />
        <input type="hidden" name="reviewerNotes" value={notes} />
        <Button
          type="submit"
          variant="outline"
          fullWidth
          loading={notesPending}
        >
          Guardar notas
        </Button>
      </form>
      {notesState?.ok === true ? (
        <p className="text-success text-xs" role="status">
          {notesState.message}
        </p>
      ) : null}
      {notesState?.ok === false ? (
        <p className="text-destructive text-xs" role="alert">
          {notesState.error}
        </p>
      ) : null}

      {!isApproved ? (
        <form action={approveAction} className="space-y-2">
          <input type="hidden" name="listingId" value={listingId} />
          <input type="hidden" name="reviewerNotes" value={notes} />
          <Button type="submit" fullWidth loading={approvePending}>
            {isRejected ? "Cambiar a aprobado" : "Aprobar y publicar"}
          </Button>
        </form>
      ) : (
        <p className="text-success text-xs" role="status">
          Estado actual: aprobado y publicado.
        </p>
      )}
      {approveState?.ok === true ? (
        <p className="text-success text-xs" role="status">
          {approveState.message}
        </p>
      ) : null}
      {approveState?.ok === false ? (
        <p className="text-destructive text-xs" role="alert">
          {approveState.error}
        </p>
      ) : null}

      <form action={rejectAction} className="space-y-3">
        <input type="hidden" name="listingId" value={listingId} />
        <input type="hidden" name="reviewerNotes" value={notes} />
        <div className="space-y-2">
          <Label htmlFor={`reject-${listingId}`}>Motivo de rechazo</Label>
          <Input
            id={`reject-${listingId}`}
            name="rejectionReason"
            required
            defaultValue={initialRejectionReason ?? ""}
            placeholder="Ej. Las fotos no muestran el estado real del equipo"
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          fullWidth
          loading={rejectPending}
        >
          {isRejected
            ? "Actualizar rechazo"
            : isApproved
              ? "Cambiar a rechazado"
              : "Rechazar anuncio"}
        </Button>
      </form>
      {rejectState?.ok === true ? (
        <p className="text-success text-xs" role="status">
          {rejectState.message}
        </p>
      ) : null}
      {rejectState?.ok === false ? (
        <p className="text-destructive text-xs" role="alert">
          {rejectState.error}
        </p>
      ) : null}
    </div>
  );
}
