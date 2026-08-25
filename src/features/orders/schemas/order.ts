/**
 * @file order.ts
 * @description Zod schemas and related types for orders (order.ts).
 * @dependencies zod
 */

import { z } from "zod";

/** createOrderSchema — validates input for related createOrder flows. */
export const createOrderSchema = z.object({
  listingId: z.string().min(1, "Anuncio inválido."),
});

/** cancelOrderSchema — validates input for related cancelOrder flows. */
export const cancelOrderSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
  reason: z
    .string()
    .trim()
    .max(500, "El motivo es demasiado largo.")
    .optional()
    .nullable(),
});

/**
 * opsCancelSellerAbandonSchema — REVIEWER/ADMIN cancel of a PAID order as seller abandon.
 * Reason is required for the ops audit trail.
 */
export const opsCancelSellerAbandonSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
  reason: z
    .string()
    .trim()
    .min(5, "Escribe un motivo breve (mín. 5 caracteres).")
    .max(500, "El motivo es demasiado largo."),
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

/**
 * fieldErrorsFromZod
 *
 * Flattens Zod issues into a field-name → messages map for form UI.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy orders UI and related modules
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
