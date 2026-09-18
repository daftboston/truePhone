/**
 * @file checkout-gate.ts
 * @description Pure availability-hold rules for checkout and payment-success gates.
 */

import type { AvailabilityHoldStatus } from "@prisma/client";

/** Buyer must wait for seller confirmation before checkout. */
export const HOLD_MISSING_CHECKOUT_ERROR =
  "Debes esperar la confirmación del vendedor antes de pagar.";

/** Post-confirm unlock window elapsed — buyer must request again. */
export const HOLD_UNLOCK_EXPIRED_CHECKOUT_ERROR =
  "El plazo para pagar después de la confirmación venció. Solicita de nuevo.";

export type HoldCheckoutSnapshot = {
  status: AvailabilityHoldStatus;
  unlockExpiresAt: Date | null;
} | null;

export type AvailabilityHoldCheckoutGateResult =
  { allowed: true; holdRequired: boolean } | { allowed: false; error: string };

/**
 * evaluateAvailabilityHoldCheckoutGate
 *
 * Shared hold rules for startCheckout and markPaymentSucceeded on flagged listings.
 */
export function evaluateAvailabilityHoldCheckoutGate(input: {
  alsoListedElsewhere: boolean;
  hold: HoldCheckoutSnapshot;
  now: Date;
}): AvailabilityHoldCheckoutGateResult {
  if (!input.alsoListedElsewhere) {
    return { allowed: true, holdRequired: false };
  }

  if (!input.hold || input.hold.status !== "CONFIRMED") {
    return { allowed: false, error: HOLD_MISSING_CHECKOUT_ERROR };
  }

  if (input.hold.unlockExpiresAt && input.now > input.hold.unlockExpiresAt) {
    return { allowed: false, error: HOLD_UNLOCK_EXPIRED_CHECKOUT_ERROR };
  }

  return { allowed: true, holdRequired: true };
}

export type PaymentSuccessHoldAction =
  { action: "proceed" } | { action: "refund_mistaken_capture"; reason: string };

/**
 * resolvePaymentSuccessHoldAction
 *
 * When Wompi approves after unlock expiry, refund instead of marking order PAID.
 */
export function resolvePaymentSuccessHoldAction(input: {
  alsoListedElsewhere: boolean;
  hold: HoldCheckoutSnapshot;
  now: Date;
}): PaymentSuccessHoldAction {
  const gate = evaluateAvailabilityHoldCheckoutGate(input);
  if (!gate.allowed) {
    return { action: "refund_mistaken_capture", reason: gate.error };
  }
  return { action: "proceed" };
}
