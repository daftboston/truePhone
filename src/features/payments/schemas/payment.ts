import { z } from "zod";

export const startCheckoutSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
});

export const confirmMockPaymentSchema = z.object({
  reference: z.string().min(1, "Referencia inválida."),
});

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
