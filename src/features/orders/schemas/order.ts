import { z } from "zod";

export const createOrderSchema = z.object({
  listingId: z.string().min(1, "Anuncio inválido."),
});

export const cancelOrderSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
  reason: z
    .string()
    .trim()
    .max(500, "El motivo es demasiado largo.")
    .optional()
    .nullable(),
});

export const completeOrderSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
});

export type OrderActionState =
  | {
      ok: true;
      message?: string;
      orderId?: string;
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
