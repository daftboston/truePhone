/**
 * @file listing-qa.ts
 * @description Zod schemas and action state for public listing Q&A.
 * @dependencies zod, @/lib/listing-qa
 */

import { z } from "zod";

import {
  LISTING_QA_BODY_MAX,
  LISTING_QA_REPORT_REASON_MAX,
  LISTING_QA_REPORT_REASON_MIN,
} from "@/lib/listing-qa-access";

export { LISTING_QA_BODY_MAX } from "@/lib/listing-qa-access";

/** askListingQuestionSchema — validates a public listing question. */
export const askListingQuestionSchema = z.object({
  listingId: z.string().min(1, "Anuncio inválido."),
  body: z
    .string()
    .trim()
    .min(1, "Escribe tu pregunta.")
    .max(LISTING_QA_BODY_MAX, "La pregunta es demasiado larga."),
});

/** answerListingQuestionSchema — validates a seller answer create. */
export const answerListingQuestionSchema = z.object({
  questionId: z.string().min(1, "Pregunta inválida."),
  body: z
    .string()
    .trim()
    .min(1, "Escribe tu respuesta.")
    .max(LISTING_QA_BODY_MAX, "La respuesta es demasiado larga."),
});

/** editListingAnswerSchema — validates a seller answer edit. */
export const editListingAnswerSchema = z.object({
  answerId: z.string().min(1, "Respuesta inválida."),
  body: z
    .string()
    .trim()
    .min(1, "Escribe tu respuesta.")
    .max(LISTING_QA_BODY_MAX, "La respuesta es demasiado larga."),
});

/** deleteListingQuestionSchema — validates asker delete of an unanswered question. */
export const deleteListingQuestionSchema = z.object({
  questionId: z.string().min(1, "Pregunta inválida."),
});

/** reportListingQuestionSchema — validates a question or answer report. */
export const reportListingQuestionSchema = z
  .object({
    questionId: z.string().optional(),
    answerId: z.string().optional(),
    reason: z
      .string()
      .trim()
      .min(
        LISTING_QA_REPORT_REASON_MIN,
        "Describe el problema (mínimo 10 caracteres).",
      )
      .max(LISTING_QA_REPORT_REASON_MAX, "El motivo es demasiado largo."),
  })
  .refine((value) => Boolean(value.questionId) !== Boolean(value.answerId), {
    message: "Elige una pregunta o una respuesta.",
  });

/** hideListingQuestionSchema — validates staff hide of a question. */
export const hideListingQuestionSchema = z.object({
  questionId: z.string().min(1, "Pregunta inválida."),
});

/** hideListingAnswerSchema — validates staff hide of an answer. */
export const hideListingAnswerSchema = z.object({
  answerId: z.string().min(1, "Respuesta inválida."),
});

/** dismissListingQuestionReportsSchema — validates staff dismiss of reports. */
export const dismissListingQuestionReportsSchema = z
  .object({
    questionId: z.string().optional(),
    answerId: z.string().optional(),
  })
  .refine((value) => Boolean(value.questionId) || Boolean(value.answerId), {
    message: "Elige una pregunta o una respuesta.",
  });

export type ListingQaActionState =
  | {
      ok: true;
      message?: string;
      questionId?: string;
      answerId?: string;
    }
  | {
      ok: false;
      error: string;
      loginRequired?: boolean;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

/**
 * fieldErrorsFromZod
 *
 * Flattens Zod issues into a field-name → messages map for form UI.
 *
 * @param error - Zod validation error.
 * @returns Field error map.
 * @calledBy listing Q&A server actions
 */
export function fieldErrorsFromZod(
  error: z.ZodError,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    fieldErrors[key] ??= [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}
