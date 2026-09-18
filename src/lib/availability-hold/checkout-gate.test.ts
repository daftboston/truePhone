import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  evaluateAvailabilityHoldCheckoutGate,
  HOLD_MISSING_CHECKOUT_ERROR,
  HOLD_UNLOCK_EXPIRED_CHECKOUT_ERROR,
  resolvePaymentSuccessHoldAction,
} from "@/lib/availability-hold/checkout-gate";

const now = new Date("2026-09-18T12:00:00.000Z");

describe("evaluateAvailabilityHoldCheckoutGate", () => {
  it("allows checkout when listing is not flagged", () => {
    const result = evaluateAvailabilityHoldCheckoutGate({
      alsoListedElsewhere: false,
      hold: null,
      now,
    });
    assert.equal(result.allowed, true);
    if (result.allowed) {
      assert.equal(result.holdRequired, false);
    }
  });

  it("blocks startCheckout without CONFIRMED unlock on flagged listing", () => {
    const pending = evaluateAvailabilityHoldCheckoutGate({
      alsoListedElsewhere: true,
      hold: { status: "PENDING", unlockExpiresAt: null },
      now,
    });
    assert.equal(pending.allowed, false);
    if (!pending.allowed) {
      assert.equal(pending.error, HOLD_MISSING_CHECKOUT_ERROR);
    }

    const missing = evaluateAvailabilityHoldCheckoutGate({
      alsoListedElsewhere: true,
      hold: null,
      now,
    });
    assert.equal(missing.allowed, false);
    if (!missing.allowed) {
      assert.equal(missing.error, HOLD_MISSING_CHECKOUT_ERROR);
    }
  });

  it("blocks startCheckout when unlock expired on flagged listing", () => {
    const result = evaluateAvailabilityHoldCheckoutGate({
      alsoListedElsewhere: true,
      hold: {
        status: "CONFIRMED",
        unlockExpiresAt: new Date("2026-09-18T11:59:59.000Z"),
      },
      now,
    });
    assert.equal(result.allowed, false);
    if (!result.allowed) {
      assert.equal(result.error, HOLD_UNLOCK_EXPIRED_CHECKOUT_ERROR);
    }
  });

  it("allows checkout with active CONFIRMED unlock", () => {
    const result = evaluateAvailabilityHoldCheckoutGate({
      alsoListedElsewhere: true,
      hold: {
        status: "CONFIRMED",
        unlockExpiresAt: new Date("2026-09-18T12:30:00.000Z"),
      },
      now,
    });
    assert.equal(result.allowed, true);
    if (result.allowed) {
      assert.equal(result.holdRequired, true);
    }
  });
});

describe("resolvePaymentSuccessHoldAction", () => {
  it("refunds mistaken capture when hold missing or unlock expired", () => {
    const missing = resolvePaymentSuccessHoldAction({
      alsoListedElsewhere: true,
      hold: null,
      now,
    });
    assert.deepEqual(missing, {
      action: "refund_mistaken_capture",
      reason: HOLD_MISSING_CHECKOUT_ERROR,
    });

    const expired = resolvePaymentSuccessHoldAction({
      alsoListedElsewhere: true,
      hold: {
        status: "CONFIRMED",
        unlockExpiresAt: new Date("2026-09-18T11:00:00.000Z"),
      },
      now,
    });
    assert.deepEqual(expired, {
      action: "refund_mistaken_capture",
      reason: HOLD_UNLOCK_EXPIRED_CHECKOUT_ERROR,
    });
  });

  it("proceeds when hold is valid so order may become PAID", () => {
    const result = resolvePaymentSuccessHoldAction({
      alsoListedElsewhere: true,
      hold: {
        status: "CONFIRMED",
        unlockExpiresAt: new Date("2026-09-18T13:00:00.000Z"),
      },
      now,
    });
    assert.deepEqual(result, { action: "proceed" });
  });
});
