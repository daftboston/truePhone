/**
 * @file order-support.ts
 * @description Validates seller and staff mutations for order-support cases.
 * @dependencies zod
 */

import { z } from "zod";

export const orderSupportCaseTypeSchema = z.enum([
  "SELLER_CANCELLATION",
  "FULFILLMENT_EXCEPTION",
  "GENERAL_SUPPORT",
]);

export const createOrderSupportCaseSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
  type: orderSupportCaseTypeSchema,
  initialReason: z
    .string()
    .trim()
    .min(10, "Cuéntanos un poco más (mín. 10 caracteres).")
    .max(1000, "El motivo es demasiado largo."),
});

export const replyOrderSupportCaseSchema = z.object({
  caseId: z.string().min(1, "Solicitud inválida."),
  body: z
    .string()
    .trim()
    .min(1, "Escribe un mensaje.")
    .max(2000, "El mensaje es demasiado largo."),
});

export const withdrawOrderSupportCaseSchema = z.object({
  caseId: z.string().min(1, "Solicitud inválida."),
});

export const staffOrderSupportMessageSchema =
  replyOrderSupportCaseSchema.extend({
    isInternal: z.coerce.boolean().default(false),
  });

export const staffOrderSupportDecisionSchema = z.object({
  caseId: z.string().min(1, "Solicitud inválida."),
  decision: z.enum([
    "REQUEST_SELLER_RESPONSE",
    "APPROVE_CANCELLATION",
    "REJECT",
    "RESOLVE",
    "ESCALATE",
    "CONTINUE_FULFILLMENT",
  ]),
  note: z
    .string()
    .trim()
    .min(5, "Escribe una nota breve (mín. 5 caracteres).")
    .max(1000, "La nota es demasiado larga."),
});

export type OrderSupportActionState =
  | { ok: true; message: string; caseId?: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      loginRequired?: boolean;
    }
  | null;
