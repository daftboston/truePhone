/**
 * @file pqr.ts
 * @description Validates consumer and staff mutations for PQR cases.
 * @dependencies zod
 */

import { z } from "zod";

export const pqrCaseTypeSchema = z.enum([
  "PETICION",
  "QUEJA",
  "RECLAMO",
  "RETRACTO",
  "HABEAS_DATA",
  "OTRO",
]);

export const createPqrCaseSchema = z.object({
  tipo: pqrCaseTypeSchema,
  fullName: z
    .string()
    .trim()
    .min(2, "Escribe tu nombre completo.")
    .max(120, "El nombre es demasiado largo."),
  email: z
    .string()
    .trim()
    .email("Escribe un correo válido.")
    .max(254, "El correo es demasiado largo."),
  orderId: z
    .string()
    .trim()
    .max(64, "Número de pedido inválido.")
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  body: z
    .string()
    .trim()
    .min(10, "Cuéntanos un poco más (mín. 10 caracteres).")
    .max(4000, "La descripción es demasiado larga."),
});

export const staffRespondPqrCaseSchema = z.object({
  caseId: z.string().min(1, "Caso inválido."),
  respuesta: z
    .string()
    .trim()
    .min(5, "Escribe una respuesta (mín. 5 caracteres).")
    .max(4000, "La respuesta es demasiado larga."),
});

export const staffClosePqrCaseSchema = z.object({
  caseId: z.string().min(1, "Caso inválido."),
});

export const claimPqrCaseSchema = z.object({
  caseId: z.string().min(1, "Caso inválido."),
});

export type PqrActionState =
  | {
      ok: true;
      message: string;
      radicado?: string;
      createdAt?: string;
      caseId?: string;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      loginRequired?: boolean;
    }
  | null;
