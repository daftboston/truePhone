/**
 * @file payment.ts
 * @description Zod schemas and action state for checkout and mock payment confirmation.
 * @dependencies zod
 */

import { z } from "zod";

/** Validates order id when starting checkout. */
export const startCheckoutSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
});

/** Validates payment reference for mock provider confirmation. */
export const confirmMockPaymentSchema = z.object({
  reference: z.string().min(1, "Referencia inválida."),
});

/**
 * Result shape returned by payment server actions bound to useActionState.
 * `null` is the idle initial state before the first submission.
 */
export type PaymentActionState =
  | {
      ok: true;
      message?: string;
      checkoutUrl?: string;
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
 * @param error - Zod validation error from safeParse.
 * @returns Record of field keys to error message arrays.
 * @calledBy startCheckoutAction, confirmMockPaymentAction
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
