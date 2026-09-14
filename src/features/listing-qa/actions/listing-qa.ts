"use server";

/**
 * @file listing-qa.ts
 * @description Server actions for public listing Q&A (Phase 8b).
 * @dependencies next/cache, @/features/listing-qa/schemas/listing-qa, @/lib/auth/session, @/lib/listing-qa
 */

import { revalidatePath } from "next/cache";

import {
  answerListingQuestionSchema,
  deleteListingQuestionSchema,
  dismissListingQuestionReportsSchema,
  editListingAnswerSchema,
  fieldErrorsFromZod,
  hideListingAnswerSchema,
  hideListingQuestionSchema,
  reportListingQuestionSchema,
  askListingQuestionSchema,
  type ListingQaActionState,
} from "@/features/listing-qa/schemas/listing-qa";
import { canAccessReviewPortal, getCurrentProfile } from "@/lib/auth/session";
import {
  answerListingQuestion,
  askListingQuestion,
  deleteOwnUnansweredQuestion,
  dismissListingQuestionReports,
  editListingAnswer,
  hideListingAnswer,
  hideListingQuestion,
  reportListingQa,
} from "@/lib/listing-qa";
import {
  notifyAskerQuestionAnswered,
  notifySellerNewListingQuestion,
  safeNotify,
} from "@/lib/notifications/marketplace";
import { prisma } from "@/lib/db";

/**
 * revalidateListingQaPaths
 *
 * Revalidates public listing, seller hub, and Q&A moderation paths.
 *
 * @param input.listingId - Listing UUID.
 * @param input.listingSlug - Public listing slug.
 * @calledBy listing Q&A server actions
 */
function revalidateListingQaPaths(input: {
  listingId?: string;
  listingSlug?: string;
}) {
  if (input.listingSlug) {
    revalidatePath(`/anuncios/${input.listingSlug}`);
  }
  if (input.listingId) {
    revalidatePath(`/vender/${input.listingId}`);
  }
  revalidatePath("/revision/preguntas");
  revalidatePath("/revision");
}

/**
 * askListingQuestionAction
 *
 * Posts a public listing question for a signed-in non-owner.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - listingId and body.
 * @returns Action state; loginRequired when unauthenticated.
 * @calledBy AskQuestionForm
 */
export async function askListingQuestionAction(
  _prev: ListingQaActionState,
  formData: FormData,
): Promise<ListingQaActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión para preguntar.",
      loginRequired: true,
    };
  }

  const parsed = askListingQuestionSchema.safeParse({
    listingId: formData.get("listingId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa tu pregunta.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await askListingQuestion({
    listingId: parsed.data.listingId,
    askerId: current.profile.id,
    body: parsed.data.body,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  await safeNotify(
    notifySellerNewListingQuestion({
      questionId: result.questionId,
      sellerId: result.sellerId,
      listingTitle: result.listingTitle,
      listingSlug: result.listingSlug,
      preview: parsed.data.body,
    }),
  );

  revalidateListingQaPaths({
    listingId: parsed.data.listingId,
    listingSlug: result.listingSlug,
  });
  return {
    ok: true,
    message: "Pregunta publicada.",
    questionId: result.questionId,
  };
}

/**
 * answerListingQuestionAction
 *
 * Posts the seller's official answer to a public question.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - questionId and body.
 * @returns Action state; loginRequired when unauthenticated.
 * @calledBy AnswerQuestionForm
 */
export async function answerListingQuestionAction(
  _prev: ListingQaActionState,
  formData: FormData,
): Promise<ListingQaActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const parsed = answerListingQuestionSchema.safeParse({
    questionId: formData.get("questionId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa tu respuesta.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await answerListingQuestion({
    questionId: parsed.data.questionId,
    sellerId: current.profile.id,
    body: parsed.data.body,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  await safeNotify(
    notifyAskerQuestionAnswered({
      answerId: result.answerId,
      askerId: result.askerId,
      listingTitle: result.listingTitle,
      listingSlug: result.listingSlug,
    }),
  );

  const listingId = await listingIdForQuestion(parsed.data.questionId);
  revalidateListingQaPaths({
    listingId: listingId ?? undefined,
    listingSlug: result.listingSlug,
  });
  return {
    ok: true,
    message: "Respuesta publicada.",
    answerId: result.answerId,
  };
}

/**
 * editListingAnswerAction
 *
 * Updates the seller's official answer.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - answerId and body.
 * @returns Action state; loginRequired when unauthenticated.
 * @calledBy AnswerQuestionForm
 */
export async function editListingAnswerAction(
  _prev: ListingQaActionState,
  formData: FormData,
): Promise<ListingQaActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const parsed = editListingAnswerSchema.safeParse({
    answerId: formData.get("answerId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa tu respuesta.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await editListingAnswer({
    answerId: parsed.data.answerId,
    sellerId: current.profile.id,
    body: parsed.data.body,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const listingId = await listingIdForAnswer(parsed.data.answerId);
  revalidateListingQaPaths({
    listingId: listingId ?? undefined,
    listingSlug: result.listingSlug,
  });
  return { ok: true, message: "Respuesta actualizada." };
}

/**
 * deleteOwnUnansweredQuestionAction
 *
 * Deletes the asker's own unanswered public question.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - questionId.
 * @returns Action state; loginRequired when unauthenticated.
 * @calledBy DeleteQuestionButton
 */
export async function deleteOwnUnansweredQuestionAction(
  _prev: ListingQaActionState,
  formData: FormData,
): Promise<ListingQaActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const parsed = deleteListingQuestionSchema.safeParse({
    questionId: formData.get("questionId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Pregunta inválida." };
  }

  const listingId = await listingIdForQuestion(parsed.data.questionId);
  const result = await deleteOwnUnansweredQuestion({
    questionId: parsed.data.questionId,
    askerId: current.profile.id,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidateListingQaPaths({
    listingId: listingId ?? undefined,
    listingSlug: result.listingSlug,
  });
  return { ok: true, message: "Pregunta eliminada." };
}

/**
 * reportListingQuestionAction
 *
 * Reports a public question or answer for staff moderation.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - questionId or answerId, plus reason.
 * @returns Action state; loginRequired when unauthenticated.
 * @calledBy ReportQaButton
 */
export async function reportListingQuestionAction(
  _prev: ListingQaActionState,
  formData: FormData,
): Promise<ListingQaActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const parsed = reportListingQuestionSchema.safeParse({
    questionId: formData.get("questionId") || undefined,
    answerId: formData.get("answerId") || undefined,
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa el reporte.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await reportListingQa({
    reporterId: current.profile.id,
    questionId: parsed.data.questionId,
    answerId: parsed.data.answerId,
    reason: parsed.data.reason,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/revision/preguntas");
  revalidatePath("/revision");
  return { ok: true, message: "Reporte enviado. Lo revisaremos pronto." };
}

/**
 * hideListingQuestionAction
 *
 * Soft-hides a reported question. Staff only.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - questionId.
 * @returns Action state.
 * @calledBy QaModerationActions
 */
export async function hideListingQuestionAction(
  _prev: ListingQaActionState,
  formData: FormData,
): Promise<ListingQaActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }
  if (!canAccessReviewPortal(current.profile.role)) {
    return { ok: false, error: "No tienes permiso para moderar preguntas." };
  }

  const parsed = hideListingQuestionSchema.safeParse({
    questionId: formData.get("questionId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Pregunta inválida." };
  }

  const result = await hideListingQuestion({
    questionId: parsed.data.questionId,
    moderatorId: current.profile.id,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const listingId = await listingIdForQuestion(parsed.data.questionId);
  revalidateListingQaPaths({
    listingId: listingId ?? undefined,
    listingSlug: result.listingSlug,
  });
  return { ok: true, message: "Pregunta ocultada." };
}

/**
 * hideListingAnswerAction
 *
 * Soft-hides a reported official answer. Staff only.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - answerId.
 * @returns Action state.
 * @calledBy QaModerationActions
 */
export async function hideListingAnswerAction(
  _prev: ListingQaActionState,
  formData: FormData,
): Promise<ListingQaActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }
  if (!canAccessReviewPortal(current.profile.role)) {
    return { ok: false, error: "No tienes permiso para moderar preguntas." };
  }

  const parsed = hideListingAnswerSchema.safeParse({
    answerId: formData.get("answerId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Respuesta inválida." };
  }

  const result = await hideListingAnswer({
    answerId: parsed.data.answerId,
    moderatorId: current.profile.id,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const listingId = await listingIdForAnswer(parsed.data.answerId);
  revalidateListingQaPaths({
    listingId: listingId ?? undefined,
    listingSlug: result.listingSlug,
  });
  return { ok: true, message: "Respuesta ocultada." };
}

/**
 * dismissListingQuestionReportsAction
 *
 * Dismisses open Q&A reports without hiding the content. Staff only.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - questionId and/or answerId.
 * @returns Action state.
 * @calledBy QaModerationActions
 */
export async function dismissListingQuestionReportsAction(
  _prev: ListingQaActionState,
  formData: FormData,
): Promise<ListingQaActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }
  if (!canAccessReviewPortal(current.profile.role)) {
    return { ok: false, error: "No tienes permiso para moderar preguntas." };
  }

  const parsed = dismissListingQuestionReportsSchema.safeParse({
    questionId: formData.get("questionId") || undefined,
    answerId: formData.get("answerId") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Reporte inválido." };
  }

  const result = await dismissListingQuestionReports({
    questionId: parsed.data.questionId,
    answerId: parsed.data.answerId,
    moderatorId: current.profile.id,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/revision/preguntas");
  revalidatePath("/revision");
  return { ok: true, message: "Reportes descartados." };
}

/**
 * listingIdForQuestion
 *
 * Resolves a listing id from a question for path revalidation.
 *
 * @param questionId - Question UUID.
 * @returns Listing id or null.
 * @calledBy listing Q&A actions
 */
async function listingIdForQuestion(questionId: string) {
  const row = await prisma.listingQuestion.findFirst({
    where: { id: questionId },
    select: { listingId: true },
  });
  return row?.listingId ?? null;
}

/**
 * listingIdForAnswer
 *
 * Resolves a listing id from an answer for path revalidation.
 *
 * @param answerId - Answer UUID.
 * @returns Listing id or null.
 * @calledBy listing Q&A actions
 */
async function listingIdForAnswer(answerId: string) {
  const row = await prisma.listingQuestionAnswer.findFirst({
    where: { id: answerId },
    select: { question: { select: { listingId: true } } },
  });
  return row?.question.listingId ?? null;
}
