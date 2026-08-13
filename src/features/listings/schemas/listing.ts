/**
 * @file listing.ts
 * @description Zod schemas, Colombian operators, and helpers for listings.
 * @dependencies node:crypto, @prisma/client, zod, @/lib/financial-core/fees
 */

import { createHash, randomBytes } from "node:crypto";

import { Condition } from "@prisma/client";
import { z } from "zod";

import {
  MARKETPLACE_FEE_RATE,
  computeFees as computeMarketplaceFees,
} from "@/lib/financial-core/fees";

/** @deprecated Prefer MARKETPLACE_FEE_RATE from Financial Core. */
export const BUYER_PROTECTION_FEE_RATE = MARKETPLACE_FEE_RATE;

export const conditionLabels: Record<Condition, string> = {
  FLAWLESS: "Como nuevo",
  EXCELLENT: "Excelente",
  GOOD: "Bueno",
  FAIR: "Aceptable",
  POOR: "Con detalles",
};

/** createListingSchema — validates input for related createListing flows. */
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

/** updateListingDetailsSchema — validates input for related updateListingDetails flows. */
export const updateListingDetailsSchema = createListingSchema;

/** Colombian mobile operators shown when the iPhone is carrier-locked. */
export const COLOMBIAN_OPERATORS = [
  "Claro",
  "Movistar",
  "Tigo",
  "WOM",
  "ETB",
] as const;

export type ColombianOperator = (typeof COLOMBIAN_OPERATORS)[number];

/**
 * matchColombianOperator
 *
 * Maps a stored or typed carrier name onto the canonical Colombian operator list.
 *
 * @param value - Free-text or previously saved carrier (e.g. "claro").
 * @returns Canonical operator label, or null when it is not a known operator.
 * @calledBy updateListingSecuritySchema, SecurityForm, resolveListingCarrier
 */
export function matchColombianOperator(
  value: string | null | undefined,
): ColombianOperator | null {
  if (!value?.trim()) return null;
  const normalized = value.trim().toLowerCase();
  return (
    COLOMBIAN_OPERATORS.find(
      (operator) => operator.toLowerCase() === normalized,
    ) ?? null
  );
}

/**
 * resolveListingCarrier
 *
 * Persists a carrier only when the listing is locked to an operator.
 *
 * @param unlocked - Form value: "true" means factory-unlocked.
 * @param carrier - Selected or previously saved operator name.
 * @returns Canonical operator, or null when the device is unlocked.
 * @calledBy updateListingSecurityAction
 */
export function resolveListingCarrier(
  unlocked: "true" | "false",
  carrier: string | null | undefined,
): ColombianOperator | null {
  if (unlocked === "true") return null;
  return matchColombianOperator(carrier);
}

/** updateListingSecuritySchema — validates input for related updateListingSecurity flows. */
export const updateListingSecuritySchema = z
  .object({
    imei: z
      .string()
      .trim()
      .regex(/^\d{15}$/, "El IMEI debe tener 15 dígitos."),
    activationLocked: z.enum(["true", "false"]),
    unlocked: z.enum(["true", "false"]),
    carrier: z.string().trim().max(40).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.unlocked !== "false") return;
    if (!matchColombianOperator(data.carrier)) {
      ctx.addIssue({
        code: "custom",
        path: ["carrier"],
        message: "Selecciona el operador.",
      });
    }
  });

/** Listing preview: equipment + default 10% marketplace fee. */
export function computeFees(price: number) {
  const fees = computeMarketplaceFees(price, "default");
  return {
    platformFee: fees.platformFee,
    finalPrice: fees.finalPrice,
  };
}

/**
 * hashImei
 *
 * Supports listings by implementing hashImei.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
export function hashImei(imei: string) {
  return createHash("sha256").update(imei.trim()).digest("hex");
}

/**
 * imeiLast4
 *
 * Supports listings by implementing imeiLast4.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
export function imeiLast4(imei: string) {
  return imei.trim().slice(-4);
}

/**
 * generatePossessionCode
 *
 * Supports listings by implementing generatePossessionCode.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
export function generatePossessionCode() {
  return `TP-${randomBytes(2).toString("hex").toUpperCase()}`;
}

/**
 * slugifyPart
 *
 * Supports listings by implementing slugifyPart.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
export function slugifyPart(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * buildListingSlug
 *
 * Supports listings by implementing buildListingSlug.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
export function buildListingSlug(parts: {
  modelSlug: string;
  storageGb: number;
  colorName: string;
  idSuffix: string;
}) {
  const color = slugifyPart(parts.colorName);
  return `${parts.modelSlug}-${parts.storageGb}gb-${color}-${parts.idSuffix}`;
}

/**
 * buildListingTitle
 *
 * Supports listings by implementing buildListingTitle.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
export function buildListingTitle(parts: {
  modelName: string;
  storageGb: number;
  colorName: string;
}) {
  return `${parts.modelName} ${parts.storageGb} GB · ${parts.colorName}`;
}

/**
 * listingStatusLabel
 *
 * Supports listings by implementing listingStatusLabel.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
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
