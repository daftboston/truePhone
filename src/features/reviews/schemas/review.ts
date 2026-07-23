import { z } from "zod";

export const REVIEW_COMMENT_MAX = 1000;

export const createReviewSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
  rating: z.coerce
    .number()
    .int("La calificación debe ser un número entero.")
    .min(1, "Elige una calificación de 1 a 5.")
    .max(5, "Elige una calificación de 1 a 5."),
  comment: z
    .string()
    .trim()
    .max(REVIEW_COMMENT_MAX, "El comentario es demasiado largo.")
    .optional()
    .nullable(),
});

export const reportReviewSchema = z.object({
  reviewId: z.string().min(1, "Reseña inválida."),
  reason: z
    .string()
    .trim()
    .min(10, "Describe el problema (mínimo 10 caracteres).")
    .max(1000, "El motivo es demasiado largo."),
});

export const moderateReviewSchema = z.object({
  reviewId: z.string().min(1, "Reseña inválida."),
});

export type ReviewActionState =
  | {
      ok: true;
      message?: string;
      reviewId?: string;
    }
  | {
      ok: false;
      error: string;
      loginRequired?: boolean;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

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
