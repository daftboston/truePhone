import { z } from "zod";
import { MAX_COP } from "@/lib/buyback/policy";
export const idSchema = z.string().min(1).max(100);
export const draftSchema = z.object({
  clientRequestId: z.string().uuid(),
  iphoneModelId: idSchema,
  iphoneStorageId: idSchema,
  condition: z.enum(["FLAWLESS", "EXCELLENT", "GOOD", "FAIR", "POOR"]),
  batteryHealth: z.number().int().min(0).max(100),
  description: z.string().trim().min(10).max(2000),
  city: z.literal("Bogotá"),
  ownershipConfirmed: z.literal(true),
  activationLockOff: z.literal(true),
});
export const quoteVersionSchema = z.object({
  quoteId: idSchema,
  expectedVersion: z.number().int().positive(),
});
export const offerSchema = quoteVersionSchema.extend({
  amountCop: z.number().int().positive().max(MAX_COP),
});
export const acceptSchema = z.object({
  quoteId: idSchema,
  offerId: idSchema,
  expectedOfferVersion: z.number().int().positive(),
  conditionsAccepted: z.literal(true),
});
