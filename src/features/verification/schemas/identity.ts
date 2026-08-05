/**
 * @file identity.ts
 * @description Zod schemas and related types for verification (identity.ts).
 * @dependencies node:crypto, zod
 */

import { createHash } from "node:crypto";

import { z } from "zod";

/** cedulaNumberSchema — validates input for related cedulaNumber flows. */
export const cedulaNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{6,12}$/, "Ingresa un número de cédula válido (solo dígitos).");

/** rejectIdentitySchema — validates input for related rejectIdentity flows. */
export const rejectIdentitySchema = z.object({
  verificationId: z.string().min(1),
  rejectionReason: z
    .string()
    .trim()
    .min(8, "Explica el motivo del rechazo (mínimo 8 caracteres).")
    .max(500, "El motivo es demasiado largo."),
});

/** approveIdentitySchema — validates input for related approveIdentity flows. */
export const approveIdentitySchema = z.object({
  verificationId: z.string().min(1),
});

/**
 * hashDocumentNumber
 *
 * Supports verification by implementing hashDocumentNumber.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy verification UI and related modules
 */
export function hashDocumentNumber(documentNumber: string) {
  return createHash("sha256").update(documentNumber.trim()).digest("hex");
}

/**
 * documentLast4
 *
 * Supports verification by implementing documentLast4.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy verification UI and related modules
 */
export function documentLast4(documentNumber: string) {
  const digits = documentNumber.trim();
  return digits.slice(-4);
}
