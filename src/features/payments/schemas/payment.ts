/**
 * @file payment.ts
 * @description Zod schemas and action state for checkout and mock payment confirmation.
 * @dependencies zod
 */

import { z } from "zod";

/** Validates order id, Ley 527 acceptance, and delivery address when starting checkout. */
export const startCheckoutSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
  legalAccepted: z.literal(true, {
    error: "Debes aceptar los Términos y la Política de Privacidad.",
  }),
  recipientName: z
    .string()
    .trim()
    .min(2, "Indica el nombre de quien recibe.")
    .max(120, "El nombre es demasiado largo."),
  phone: z
    .string()
    .trim()
    .min(7, "Indica un teléfono de contacto.")
    .max(20, "El teléfono es demasiado largo."),
  department: z.string().trim().min(1, "Selecciona el departamento."),
  cityOption: z.string().trim().min(1, "Selecciona la ciudad."),
  cityDetail: z
    .string()
    .trim()
    .max(120, "La ciudad es demasiado larga.")
    .optional()
    .or(z.literal("")),
  addressLine: z
    .string()
    .trim()
    .min(5, "Indica la dirección completa.")
    .max(200, "La dirección es demasiado larga."),
  notes: z
    .string()
    .trim()
    .max(300, "Las notas son demasiado largas.")
    .optional()
    .or(z.literal("")),
});

/** Validates payment reference and legal acceptance for mock confirmation. */
export const confirmMockPaymentSchema = z.object({
  reference: z.string().min(1, "Referencia inválida."),
  legalAccepted: z.literal(true, {
    error: "Debes aceptar los Términos y la Política de Privacidad.",
  }),
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
