/**
 * @file shipping.ts
 * @description Zod schemas and action state for order shipping flows.
 * @dependencies zod, @/lib/shipping/labels
 */

import { z } from "zod";

import { CARRIER_OPTIONS } from "@/lib/shipping/labels";

/** Seller selects Premium Bogotá or carrier shipping. */
export const selectShippingMethodSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
  method: z.enum(["PREMIUM_BOGOTA", "CARRIER"], {
    message: "Elige Premium o transportadora.",
  }),
});

/** Seller switches from carrier to Premium before tracking is locked. */
export const switchToPremiumSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
});

/** Seller uploads carrier name, tracking code, and optional evidence URL. */
export const uploadCarrierTrackingSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
  carrierName: z
    .string()
    .trim()
    .min(2, "Indica la transportadora.")
    .max(80)
    .refine(
      (v) =>
        (CARRIER_OPTIONS as readonly string[]).includes(v) || v.length >= 2,
      "Transportadora inválida.",
    ),
  trackingCode: z
    .string()
    .trim()
    .min(4, "El código de seguimiento es obligatorio.")
    .max(80, "Código demasiado largo."),
  evidenceUrl: z
    .string()
    .trim()
    .url("URL inválida.")
    .max(500)
    .optional()
    .nullable()
    .or(z.literal("")),
});

/** Buyer marks physical receipt (starts 24h confirm window). */
export const markReceivedSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
});

/** Ops records Premium inspection pass/fail checklist. */
export const premiumInspectionSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
  result: z.enum(["PASSED", "FAILED"]),
  imeiMatch: z.coerce.boolean().optional(),
  serialMatch: z.coerce.boolean().optional(),
  storageMatch: z.coerce.boolean().optional(),
  colorMatch: z.coerce.boolean().optional(),
  accessoriesOk: z.coerce.boolean().optional(),
  batteryHealthPct: z.coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .nullable(),
  cosmeticNotes: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

/** Buyer confirms device is correct (releases settlement path). */
export const confirmReceivedSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
});

/** Buyer reports a problem during the confirm window (freezes payout). */
export const reportProblemSchema = z.object({
  orderId: z.string().min(1, "Pedido inválido."),
  reason: z
    .string()
    .trim()
    .min(8, "Describe el problema (mínimo 8 caracteres).")
    .max(500),
});

/**
 * Result shape returned by shipping server actions bound to useActionState.
 * `null` is the idle initial state before the first submission.
 */
export type ShippingActionState =
  | {
      ok: true;
      message?: string;
    }
  | {
      ok: false;
      error: string;
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
 * @calledBy shipping server actions
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
