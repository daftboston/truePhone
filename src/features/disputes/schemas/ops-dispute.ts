/**
 * @file ops-dispute.ts
 * @description Zod schemas for admin chargeback / refund ops actions.
 * @dependencies zod
 */

import { z } from "zod";

export const opsRefundReasonSchema = z.enum([
  "PREMIUM_INSPECTION_FAILED",
  "DISPUTE_BUYER_WIN",
  "BATTERY_RETURN",
  "CHARGEBACK_RECONCILE",
  "MANUAL",
]);

export const opsListingOutcomeSchema = z.enum(["republish", "archive"]);

/** authorizeOpsRefundSchema — validates ops buyer-refund form. */
export const authorizeOpsRefundSchema = z.object({
  orderId: z.string().min(1),
  reason: opsRefundReasonSchema,
  listingOutcome: opsListingOutcomeSchema.optional(),
  notes: z.string().max(500).optional(),
});

/** resolveDisputeForSellerSchema — validates seller-win unfreeze form. */
export const resolveDisputeForSellerSchema = z.object({
  orderId: z.string().min(1),
  memo: z.string().max(500).optional(),
});

/** recordChargebackSchema — validates manual chargeback ingestion. */
export const recordChargebackSchema = z.object({
  paymentId: z.string().min(1),
  amountPesos: z.coerce.number().int().positive().optional(),
  providerReference: z.string().max(120).optional(),
  memo: z.string().max(500).optional(),
});

/** markChargebackAbsorbedSchema — validates absorb acknowledgment. */
export const markChargebackAbsorbedSchema = z.object({
  orderId: z.string().min(1),
  notes: z.string().max(500).optional(),
});
