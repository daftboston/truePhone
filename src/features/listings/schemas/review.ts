import { z } from "zod";

export const listingReviewTabSchema = z.enum([
  "todos",
  "pendiente",
  "en_revision",
  "aprobados",
  "rechazados",
]);

export type ListingReviewTab = z.infer<typeof listingReviewTabSchema>;

export const approveListingSchema = z.object({
  listingId: z.string().min(1),
  reviewerNotes: z
    .string()
    .trim()
    .max(1000, "Las notas son demasiado largas.")
    .optional()
    .or(z.literal("")),
});

export const rejectListingSchema = z.object({
  listingId: z.string().min(1),
  rejectionReason: z
    .string()
    .trim()
    .min(8, "Explica el motivo del rechazo (mínimo 8 caracteres).")
    .max(500, "El motivo es demasiado largo."),
  reviewerNotes: z
    .string()
    .trim()
    .max(1000, "Las notas son demasiado largas.")
    .optional()
    .or(z.literal("")),
});

export const saveListingReviewNotesSchema = z.object({
  listingId: z.string().min(1),
  reviewerNotes: z
    .string()
    .trim()
    .max(1000, "Las notas son demasiado largas.")
    .optional()
    .or(z.literal("")),
});

/** Static quality checklist shown to reviewers (PRD §21). Not persisted. */
export const LISTING_QUALITY_CHECKLIST = [
  "Fotos claras y suficientes del dispositivo",
  "Condición y batería coherentes con las fotos",
  "Precio razonable para el modelo y estado",
  "Descripción precisa (sin promesas engañosas)",
  "IMEI / Activation Lock revisados",
  "Sin indicios claros de fraude o duplicado",
] as const;

export const EDITABLE_REVIEW_STATUSES = [
  "PENDING_REVIEW",
  "PUBLISHED",
  "APPROVED",
  "REJECTED",
] as const;
