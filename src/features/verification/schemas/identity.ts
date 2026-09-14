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

/** identityReviewTabSchema — reviewer identity queue tabs. */
export const identityReviewTabSchema = z.enum([
  "pendiente",
  "en_revision",
  "aprobados",
  "rechazados",
]);

export type IdentityReviewTab = z.infer<typeof identityReviewTabSchema>;

/**
 * resolveOptionalIdentityFile
 *
 * Accepts a new File, or keeps an existing stored path when the input is empty.
 *
 * @param value - FormData file field.
 * @param existingPath - Already saved storage path.
 * @param missingMessage - Error when neither file nor existing path exists.
 * @returns File to upload, null to keep existing, or an error.
 * @calledBy saveCedulaFrontAction, saveCedulaBackAction, saveSelfieAction
 */
export function resolveOptionalIdentityFile(
  value: FormDataEntryValue | null,
  existingPath: string | null | undefined,
  missingMessage: string,
): { ok: true; file: File | null } | { ok: false; error: string } {
  if (value instanceof File && value.size > 0) {
    return { ok: true, file: value };
  }
  if (existingPath) {
    return { ok: true, file: null };
  }
  return { ok: false, error: missingMessage };
}

/**
 * resolveCedulaNumberInput
 *
 * Requires a valid cédula on first capture; allows empty when a hash already exists.
 *
 * @param value - FormData documentNumber field.
 * @param hasExistingHash - True when the draft already stored a hash.
 * @returns Digits to persist, keepExisting, or field errors.
 * @calledBy saveCedulaFrontAction
 */
export function resolveCedulaNumberInput(
  value: FormDataEntryValue | null,
  hasExistingHash: boolean,
):
  | { ok: true; documentNumber: string | null }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> } {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    if (hasExistingHash) return { ok: true, documentNumber: null };
    return {
      ok: false,
      error: "Revisa el número de cédula.",
      fieldErrors: {
        documentNumber: ["Ingresa un número de cédula válido (solo dígitos)."],
      },
    };
  }
  const parsed = cedulaNumberSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa el número de cédula.",
      fieldErrors: {
        documentNumber: parsed.error.issues.map((issue) => issue.message),
      },
    };
  }
  return { ok: true, documentNumber: parsed.data };
}

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
