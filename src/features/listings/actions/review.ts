"use server";

/**
 * @file review.ts
 * @description Server actions for listings (review.ts).
 * @dependencies next/cache, @/features/listings/schemas/review, @/features/listings/types, @/lib/auth/session, @/lib/db
 */

import { revalidatePath } from "next/cache";

import {
  approveListingSchema,
  EDITABLE_REVIEW_STATUSES,
  rejectListingSchema,
  saveListingReviewNotesSchema,
} from "@/features/listings/schemas/review";
import type { ListingActionState } from "@/features/listings/types";
import { fieldErrorsFromZod } from "@/features/listings/types";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * requireReviewer
 *
 * Supports listings by implementing requireReviewer.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
async function requireReviewer() {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false as const, error: "Debes iniciar sesión." };
  }
  if (current.profile.role !== "REVIEWER" && current.profile.role !== "ADMIN") {
    return {
      ok: false as const,
      error: "No tienes permiso para revisar anuncios.",
    };
  }
  return { ok: true as const, current };
}

/**
 * revalidateListingReview
 *
 * Revalidates Next.js paths after listings mutations.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
function revalidateListingReview(listingId: string) {
  revalidatePath("/revision");
  revalidatePath("/revision/anuncios");
  revalidatePath(`/revision/anuncios/${listingId}`);
  revalidatePath("/vender");
  revalidatePath(`/vender/${listingId}`);
  revalidatePath(`/vender/${listingId}/enviado`);
}

/**
 * isEditableStatus
 *
 * Predicate helper used by listings UI and actions.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
function isEditableStatus(status: string) {
  return (EDITABLE_REVIEW_STATUSES as readonly string[]).includes(status);
}

/**
 * claimListingForReviewAction
 *
 * Server action: claim listing for review for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
export async function claimListingForReviewAction(listingId: string) {
  const gate = await requireReviewer();
  if (!gate.ok) return gate;

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, deletedAt: null },
  });
  if (
    !listing ||
    (listing.status !== "PENDING_REVIEW" && listing.status !== "SUBMITTED")
  ) {
    return { ok: false as const, error: "Este anuncio no está en la cola." };
  }

  if (!listing.reviewerId || listing.status === "SUBMITTED") {
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        status: "PENDING_REVIEW",
        reviewerId: listing.reviewerId ?? gate.current.profile.id,
      },
    });
    revalidateListingReview(listingId);
  }

  return { ok: true as const };
}

/**
 * saveListingReviewNotesAction
 *
 * Server action: save listing review notes for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
export async function saveListingReviewNotesAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const gate = await requireReviewer();
  if (!gate.ok) return { ok: false, error: gate.error };

  const parsed = saveListingReviewNotesSchema.safeParse({
    listingId: formData.get("listingId"),
    reviewerNotes: formData.get("reviewerNotes"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa las notas internas.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const listing = await prisma.listing.findFirst({
    where: { id: parsed.data.listingId, deletedAt: null },
  });
  if (!listing || !isEditableStatus(listing.status)) {
    return {
      ok: false,
      error: "No puedes editar las notas de este anuncio.",
    };
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      reviewerNotes: parsed.data.reviewerNotes || null,
      reviewerId: listing.reviewerId ?? gate.current.profile.id,
    },
  });

  revalidateListingReview(listing.id);
  return { ok: true, message: "Notas guardadas." };
}

/**
 * approveListingAction
 *
 * Approves a listing as PUBLISHED. On first publish, promotes the seller
 * profile from BUYER to SELLER (identity verify alone does not set SELLER).
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - listingId and optional reviewerNotes.
 * @returns Action state on errors or success message.
 * @calledBy ListingReviewActions
 */
export async function approveListingAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const gate = await requireReviewer();
  if (!gate.ok) return { ok: false, error: gate.error };

  const parsed = approveListingSchema.safeParse({
    listingId: formData.get("listingId"),
    reviewerNotes: formData.get("reviewerNotes"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Solicitud inválida." };
  }

  const listing = await prisma.listing.findFirst({
    where: { id: parsed.data.listingId, deletedAt: null },
  });
  if (!listing || !isEditableStatus(listing.status)) {
    return { ok: false, error: "No puedes aprobar este anuncio." };
  }

  const now = new Date();
  const wasAlreadyApproved =
    listing.status === "PUBLISHED" || listing.status === "APPROVED";

  // Publish listing; promote BUYER → SELLER only (preserves REVIEWER/ADMIN).
  await prisma.$transaction([
    prisma.listing.update({
      where: { id: listing.id },
      data: {
        status: "PUBLISHED",
        reviewerId: gate.current.profile.id,
        reviewerNotes: parsed.data.reviewerNotes || listing.reviewerNotes,
        rejectionReason: null,
        reviewedAt: now,
        approvedAt: listing.approvedAt ?? now,
      },
    }),
    prisma.profile.updateMany({
      where: { id: listing.sellerId, role: "BUYER" },
      data: { role: "SELLER" },
    }),
  ]);

  revalidateListingReview(listing.id);
  return {
    ok: true,
    message: wasAlreadyApproved
      ? "Decisión actualizada: anuncio aprobado."
      : "Anuncio aprobado y publicado.",
  };
}

/**
 * rejectListingAction
 *
 * Server action: reject listing for authenticated listings flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy listings components
 */
export async function rejectListingAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const gate = await requireReviewer();
  if (!gate.ok) return { ok: false, error: gate.error };

  const parsed = rejectListingSchema.safeParse({
    listingId: formData.get("listingId"),
    rejectionReason: formData.get("rejectionReason"),
    reviewerNotes: formData.get("reviewerNotes"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa el motivo del rechazo.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const listing = await prisma.listing.findFirst({
    where: { id: parsed.data.listingId, deletedAt: null },
  });
  if (!listing || !isEditableStatus(listing.status)) {
    return { ok: false, error: "No puedes rechazar este anuncio." };
  }

  const wasAlreadyRejected = listing.status === "REJECTED";

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      status: "REJECTED",
      reviewerId: gate.current.profile.id,
      rejectionReason: parsed.data.rejectionReason,
      reviewerNotes: parsed.data.reviewerNotes || listing.reviewerNotes,
      reviewedAt: new Date(),
      approvedAt: null,
    },
  });

  revalidateListingReview(listing.id);
  return {
    ok: true,
    message: wasAlreadyRejected
      ? "Motivo de rechazo actualizado."
      : "Anuncio rechazado.",
  };
}
