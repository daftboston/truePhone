/**
 * @file recommended-price.ts
 * @description Zod schemas for admin recommended price CRUD.
 * @dependencies @prisma/client, zod
 */

import { Condition } from "@prisma/client";
import { z } from "zod";

/** Optional integer COP from form strings; empty → undefined. */
const optionalCop = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
}, z.coerce.number().int().min(0).optional());

/** Optional calendar date (YYYY-MM-DD) from form; empty → null. */
const optionalDate = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed;
}, z.date().nullable());

/**
 * recommendedPriceSchema
 *
 * Validates create/update payload for a reference price row.
 */
export const recommendedPriceSchema = z
  .object({
    id: z.string().min(1).optional().or(z.literal("")),
    iphoneModelId: z.string().min(1, "Selecciona el modelo."),
    iphoneStorageId: z.string().min(1, "Selecciona el almacenamiento."),
    condition: z.nativeEnum(Condition),
    priceCop: z.coerce
      .number()
      .int("El precio de referencia debe ser un entero.")
      .min(100_000, "El precio mínimo de referencia es $100.000.")
      .max(20_000_000, "El precio máximo de referencia es $20.000.000."),
    minPriceCop: optionalCop,
    maxPriceCop: optionalCop,
    notes: z
      .string()
      .trim()
      .max(500, "Las notas son demasiado largas.")
      .optional()
      .or(z.literal("")),
    effectiveFrom: optionalDate,
    effectiveTo: optionalDate,
  })
  .superRefine((data, ctx) => {
    if (
      data.minPriceCop != null &&
      data.maxPriceCop != null &&
      data.minPriceCop > data.maxPriceCop
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["minPriceCop"],
        message: "El mínimo no puede ser mayor que el máximo.",
      });
    }
    if (data.minPriceCop != null && data.minPriceCop > data.priceCop) {
      ctx.addIssue({
        code: "custom",
        path: ["minPriceCop"],
        message: "El mínimo no puede superar el precio de referencia.",
      });
    }
    if (data.maxPriceCop != null && data.maxPriceCop < data.priceCop) {
      ctx.addIssue({
        code: "custom",
        path: ["maxPriceCop"],
        message: "El máximo no puede ser menor que el precio de referencia.",
      });
    }
    if (
      data.effectiveFrom &&
      data.effectiveTo &&
      data.effectiveFrom.getTime() > data.effectiveTo.getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["effectiveTo"],
        message: "La fecha fin debe ser posterior a la fecha inicio.",
      });
    }
  });

export type RecommendedPriceInput = z.infer<typeof recommendedPriceSchema>;

/**
 * deleteRecommendedPriceSchema
 *
 * Validates delete by row id.
 */
export const deleteRecommendedPriceSchema = z.object({
  id: z.string().min(1, "Falta el identificador."),
});

/**
 * fieldErrorsFromZod
 *
 * Flattens Zod issues into a field-name → messages map for form UI.
 *
 * @param error - Zod validation error from safeParse.
 * @returns Record of field keys to error message arrays.
 * @calledBy upsertRecommendedPriceAction, deleteRecommendedPriceAction
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
