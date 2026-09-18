import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { HOLD_UNLOCK_EXPIRED_CHECKOUT_ERROR } from "@/lib/availability-hold/checkout-gate";
import { resolveLateWebhookApprovedOutcome } from "@/lib/payments/mark-payment-hold-gate";

const checkoutCreatedAt = new Date("2026-09-18T12:00:00.000Z");
const unlockExpiredAt = new Date("2026-09-18T12:30:00.000Z");
const webhookApprovedAt = new Date("2026-09-18T12:45:00.000Z");

describe("late Wompi APPROVED after unlock expiry", () => {
  it("refunds mistaken capture and leaves order AWAITING_PAYMENT", () => {
    const outcome = resolveLateWebhookApprovedOutcome({
      orderStatus: "AWAITING_PAYMENT",
      paymentStatus: "REQUIRES_ACTION",
      alsoListedElsewhere: true,
      hold: {
        status: "CONFIRMED",
        unlockExpiresAt: unlockExpiredAt,
      },
      now: webhookApprovedAt,
    });

    assert.equal(outcome.action, "refund_without_paid");
    assert.equal(outcome.orderStatus, "AWAITING_PAYMENT");
    assert.equal(outcome.paymentStatus, "REFUNDED");
    assert.equal(outcome.reason, HOLD_UNLOCK_EXPIRED_CHECKOUT_ERROR);
  });

  it("allows PAID when unlock was still valid at webhook time", () => {
    const outcome = resolveLateWebhookApprovedOutcome({
      orderStatus: "AWAITING_PAYMENT",
      paymentStatus: "REQUIRES_ACTION",
      alsoListedElsewhere: true,
      hold: {
        status: "CONFIRMED",
        unlockExpiresAt: new Date("2026-09-18T13:00:00.000Z"),
      },
      now: webhookApprovedAt,
    });

    assert.equal(outcome.action, "proceed_to_paid");
    assert.equal(outcome.orderStatus, "PAID");
    assert.equal(outcome.paymentStatus, "SUCCEEDED");
  });

  it("models checkout URL created while unlock was active, paid after expiry", () => {
    const unlockValidWhenCheckoutCreated =
      webhookApprovedAt.getTime() > unlockExpiredAt.getTime();
    assert.equal(unlockValidWhenCheckoutCreated, true);

    const outcome = resolveLateWebhookApprovedOutcome({
      orderStatus: "AWAITING_PAYMENT",
      paymentStatus: "REQUIRES_ACTION",
      alsoListedElsewhere: true,
      hold: {
        status: "CONFIRMED",
        unlockExpiresAt: unlockExpiredAt,
      },
      now: webhookApprovedAt,
    });

    assert.equal(outcome.orderStatus, "AWAITING_PAYMENT");
    assert.notEqual(outcome.orderStatus, "PAID");
    assert.equal(outcome.paymentStatus, "REFUNDED");
    assert.ok(checkoutCreatedAt < unlockExpiredAt);
  });
});
