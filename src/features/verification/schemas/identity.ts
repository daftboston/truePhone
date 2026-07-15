import { createHash } from "node:crypto";

import { z } from "zod";

export const cedulaNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{6,12}$/, "Ingresa un número de cédula válido (solo dígitos).");

export const rejectIdentitySchema = z.object({
  verificationId: z.string().min(1),
  rejectionReason: z
    .string()
    .trim()
    .min(8, "Explica el motivo del rechazo (mínimo 8 caracteres).")
    .max(500, "El motivo es demasiado largo."),
});

export const approveIdentitySchema = z.object({
  verificationId: z.string().min(1),
});

export function hashDocumentNumber(documentNumber: string) {
  return createHash("sha256").update(documentNumber.trim()).digest("hex");
}

export function documentLast4(documentNumber: string) {
  const digits = documentNumber.trim();
  return digits.slice(-4);
}
