/**
 * @file mark-payment-hold-gate.ts
 * @description Pure late-webhook outcome when Wompi APPROVED after unlock expiry.
 */

import type { OrderStatus, PaymentStatus } from "@prisma/client";

import {
  evaluateAvailabilityHoldCheckoutGate,
  type HoldCheckoutSnapshot,
} from "@/lib/availability-hold/checkout-gate";

export type LateWebhookApprovedScenario = {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  alsoListedElsewhere: boolean;
  hold: HoldCheckoutSnapshot;
  now: Date;
};

export type LateWebhookApprovedOutcome = {
  action: "proceed_to_paid" | "refund_without_paid";
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  reason?: string;
};

/**
 * resolveLateWebhookApprovedOutcome
 *
 * Models markPaymentSucceeded + Wompi APPROVED when checkout was created earlier.
 */
export function resolveLateWebhookApprovedOutcome(
  scenario: LateWebhookApprovedScenario,
): LateWebhookApprovedOutcome {
  if (
    scenario.paymentStatus === "SUCCEEDED" &&
    scenario.orderStatus === "PAID"
  ) {
    return {
      action: "proceed_to_paid",
      orderStatus: "PAID",
      paymentStatus: "SUCCEEDED",
    };
  }

  const gate = evaluateAvailabilityHoldCheckoutGate({
    alsoListedElsewhere: scenario.alsoListedElsewhere,
    hold: scenario.hold,
    now: scenario.now,
  });

  if (!gate.allowed) {
    return {
      action: "refund_without_paid",
      orderStatus: "AWAITING_PAYMENT",
      paymentStatus: "REFUNDED",
      reason: gate.error,
    };
  }

  return {
    action: "proceed_to_paid",
    orderStatus: "PAID",
    paymentStatus: "SUCCEEDED",
  };
}
