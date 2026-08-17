/**
 * @file settlement-guards.test.ts
 * @description Unit tests for PAID-order cancel cutoff, manual payout completion, and ops queue filter.
 * @dependencies node:test, settlement-guards, ops-payouts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canCancelPaidOrder,
  manualPayoutCompletionBlocker,
} from "@/lib/financial-core/settlement-guards";
import { authorizedManualPayoutWhere } from "@/lib/payments/ops-payouts";

const openPaid = {
  payoutCompletedAt: null,
  payoutAuthorizedAt: null,
  buyerConfirmedAt: null,
  buyerConfirmDeadlineAt: null,
};

describe("canCancelPaidOrder", () => {
  it("allows cancel before the buyer marks received", () => {
    assert.equal(canCancelPaidOrder(openPaid), true);
  });

  it("blocks cancel after the buyer marks received (24h window started)", () => {
    assert.equal(
      canCancelPaidOrder({
        ...openPaid,
        buyerConfirmDeadlineAt: new Date("2026-08-17T12:00:00.000Z"),
      }),
      false,
    );
  });

  it("blocks cancel after the buyer confirms the device", () => {
    assert.equal(
      canCancelPaidOrder({
        ...openPaid,
        buyerConfirmedAt: new Date("2026-08-17T12:00:00.000Z"),
      }),
      false,
    );
  });

  it("blocks cancel after Financial Core authorizes seller payout", () => {
    assert.equal(
      canCancelPaidOrder({
        ...openPaid,
        payoutAuthorizedAt: new Date("2026-08-17T12:00:00.000Z"),
      }),
      false,
    );
  });

  it("blocks cancel after the seller was paid", () => {
    assert.equal(
      canCancelPaidOrder({
        ...openPaid,
        payoutCompletedAt: new Date("2026-08-17T12:00:00.000Z"),
      }),
      false,
    );
  });
});

describe("manualPayoutCompletionBlocker", () => {
  it("allows completing an unfrozen PAID order", () => {
    assert.equal(
      manualPayoutCompletionBlocker({
        status: "PAID",
        payoutFrozen: false,
        payoutCompletedAt: null,
      }),
      null,
    );
  });

  it("blocks completing a cancelled order (buyer refund already issued)", () => {
    const error = manualPayoutCompletionBlocker({
      status: "CANCELLED",
      payoutFrozen: false,
      payoutCompletedAt: null,
    });
    assert.match(error ?? "", /custodia/);
  });

  it("blocks completing a frozen dispute order", () => {
    const error = manualPayoutCompletionBlocker({
      status: "PAID",
      payoutFrozen: true,
      payoutCompletedAt: null,
    });
    assert.match(error ?? "", /congelado/);
  });

  it("is a no-op when payout already completed", () => {
    assert.equal(
      manualPayoutCompletionBlocker({
        status: "COMPLETED",
        payoutFrozen: false,
        payoutCompletedAt: new Date("2026-08-17T12:00:00.000Z"),
      }),
      null,
    );
  });
});

describe("authorizedManualPayoutWhere", () => {
  it("excludes cancelled and frozen orders from the ops pay queue", () => {
    assert.equal(authorizedManualPayoutWhere.status, "AUTHORIZED");
    assert.equal(authorizedManualPayoutWhere.order.status, "PAID");
    assert.equal(authorizedManualPayoutWhere.order.payoutFrozen, false);
  });
});
