import { createHash, randomBytes } from "node:crypto";

import { Condition } from "@prisma/client";
import { z } from "zod";

/** Buyer Protection Fee — 6% of listing price (COPY_GUIDELINES). */
export const BUYER_PROTECTION_FEE_RATE = 0.06;

export const conditionLabels: Record<Condition, string> = {
  FLAWLESS: "Como nuevo",
  EXCELLENT: "Excelente",
  GOOD: "Bueno",
  FAIR: "Aceptable",
  POOR: "Con detalles",
};

export const createListingSchema = z.object({
  iphoneModelId: z.string().min(1, "Selecciona el modelo."),
  iphoneColorId: z.string().min(1, "Selecciona el color."),
  iphoneStorageId: z.string().min(1, "Selecciona el almacenamiento."),
  condition: z.nativeEnum(Condition),
  batteryHealth: z.coerce
    .number()
    .int()
    .min(70, "La batería debe ser al menos 70%.")
    .max(100, "La batería no puede superar 100%."),
  price: z.coerce
    .number()
    .int()
    .min(100_000, "El precio mínimo es $100.000.")
    .max(20_000_000, "El precio máximo es $20.000.000."),
  description: z
    .string()
    .trim()
    .max(2000, "La descripción es demasiado larga.")
    .optional()
    .or(z.literal("")),
  hasBox: z.coerce.boolean().optional(),
  hasCharger: z.coerce.boolean().optional(),
  hasReceipt: z.coerce.boolean().optional(),
});

export const updateListingDetailsSchema = createListingSchema;

export const updateListingSecuritySchema = z.object({
  imei: z
    .string()
    .trim()
    .regex(/^\d{15}$/, "El IMEI debe tener 15 dígitos."),
  activationLocked: z.enum(["true", "false"]),
  unlocked: z.enum(["true", "false"]),
  carrier: z.string().trim().max(40).optional().or(z.literal("")),
});

export function computeFees(price: number) {
  const platformFee = Math.round(price * BUYER_PROTECTION_FEE_RATE);
  return {
    platformFee,
    finalPrice: price + platformFee,
  };
}

export function hashImei(imei: string) {
  return createHash("sha256").update(imei.trim()).digest("hex");
}

export function imeiLast4(imei: string) {
  return imei.trim().slice(-4);
}

export function generatePossessionCode() {
  return `TP-${randomBytes(2).toString("hex").toUpperCase()}`;
}

export function slugifyPart(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildListingSlug(parts: {
  modelSlug: string;
  storageGb: number;
  colorName: string;
  idSuffix: string;
}) {
  const color = slugifyPart(parts.colorName);
  return `${parts.modelSlug}-${parts.storageGb}gb-${color}-${parts.idSuffix}`;
}

export function buildListingTitle(parts: {
  modelName: string;
  storageGb: number;
  colorName: string;
}) {
  return `${parts.modelName} ${parts.storageGb} GB · ${parts.colorName}`;
}

export function listingStatusLabel(status: string) {
  switch (status) {
    case "DRAFT":
      return "Borrador";
    case "SUBMITTED":
      return "Enviado";
    case "PENDING_REVIEW":
      return "En revisión";
    case "APPROVED":
      return "Aprobado";
    case "PUBLISHED":
      return "Publicado";
    case "REJECTED":
      return "Rechazado";
    case "RESERVED":
      return "Reservado";
    case "SOLD":
      return "Vendido";
    case "ARCHIVED":
      return "Archivado";
    default:
      return status;
  }
}
