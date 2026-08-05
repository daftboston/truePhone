"use server";

/**
 * @file reviews.ts
 * @description Server actions for reviews (reviews.ts).
 * @dependencies next/cache, @/features/reviews/schemas/review, @/lib/auth/session, @/lib/db, @/lib/reviews
 */

import { revalidatePath } from "next/cache";

import {
  createReviewSchema,
  fieldErrorsFromZod,
  moderateReviewSchema,
  reportReviewSchema,
  type ReviewActionState,
} from "@/features/reviews/schemas/review";
import { canAccessReviewPortal, getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  createOrderReview,
  dismissReviewReports,
  hideReviewForModeration,
  reportReview,
} from "@/lib/reviews";

/**
 * revalidateReviewPaths
 *
 * Revalidates Next.js paths after reviews mutations.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy reviews UI and related modules
 */
function revalidateReviewPaths(input: {
  orderId?: string;
  reviewedUsername?: string | null;
}) {
  revalidatePath("/compras");
  revalidatePath("/ventas");
  revalidatePath("/perfil");
  if (input.orderId) {
    revalidatePath(`/compras/${input.orderId}`);
    revalidatePath(`/ventas/${input.orderId}`);
  }
  if (input.reviewedUsername) {
    revalidatePath(`/u/${input.reviewedUsername}`);
  }
  revalidatePath("/revision/resenas");
  revalidatePath("/revision");
}

/**
 * createReviewAction
 *
 * Server action: create review for authenticated reviews flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy reviews components
 */
export async function createReviewAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión para dejar una reseña.",
      loginRequired: true,
    };
  }

  const parsed = createReviewSchema.safeParse({
    orderId: formData.get("orderId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || null,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa la reseña.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await createOrderReview({
    orderId: parsed.data.orderId,
    reviewerId: current.profile.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const reviewed = await prisma.profile.findFirst({
    where: { id: result.reviewedUserId },
    select: { username: true },
  });

  revalidateReviewPaths({
    orderId: parsed.data.orderId,
    reviewedUsername: reviewed?.username,
  });
  return {
    ok: true,
    message: "Reseña publicada. Gracias por ayudar a la comunidad.",
    reviewId: result.reviewId,
  };
}

/**
 * reportReviewAction
 *
 * Server action: report review for authenticated reviews flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy reviews components
 */
export async function reportReviewAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const parsed = reportReviewSchema.safeParse({
    reviewId: formData.get("reviewId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa el reporte.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await reportReview({
    reviewId: parsed.data.reviewId,
    reporterId: current.profile.id,
    reason: parsed.data.reason,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/revision/resenas");
  revalidatePath("/revision");
  return { ok: true, message: "Reporte enviado. Lo revisaremos pronto." };
}

/**
 * hideReviewAction
 *
 * Server action: hide review for authenticated reviews flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy reviews components
 */
export async function hideReviewAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }
  if (!canAccessReviewPortal(current.profile.role)) {
    return { ok: false, error: "No tienes permiso para moderar reseñas." };
  }

  const parsed = moderateReviewSchema.safeParse({
    reviewId: formData.get("reviewId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Reseña inválida." };
  }

  const result = await hideReviewForModeration({
    reviewId: parsed.data.reviewId,
    moderatorId: current.profile.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidateReviewPaths({});
  revalidatePath("/", "layout");
  return { ok: true, message: "Reseña ocultada y reputación actualizada." };
}

/**
 * dismissReviewReportsAction
 *
 * Server action: dismiss review reports for authenticated reviews flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy reviews components
 */
export async function dismissReviewReportsAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }
  if (!canAccessReviewPortal(current.profile.role)) {
    return { ok: false, error: "No tienes permiso para moderar reseñas." };
  }

  const parsed = moderateReviewSchema.safeParse({
    reviewId: formData.get("reviewId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Reseña inválida." };
  }

  const result = await dismissReviewReports({
    reviewId: parsed.data.reviewId,
    moderatorId: current.profile.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/revision/resenas");
  revalidatePath("/revision");
  return { ok: true, message: "Reportes descartados." };
}
