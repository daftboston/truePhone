/**
 * @file checkout-success-guards.test.ts
 * @description Unit tests for unpaid-cancel vs payment-capture race guards.
 * @dependencies node:test, @/lib/payments/checkout-success-guards, settlement-guards
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PAYMENT_ALREADY_TERMINAL_ERROR,
  PAYMENT_SUCCESS_ORDER_NOT_AWAITING_ERROR,
  paymentStatusesEligibleForSuccess,
  paymentSuccessApplyBlocker,
} from "@/lib/payments/checkout-success-guards";
import { orderStatusWhereForCancelCommit } from "@/lib/financial-core/settlement-guards";

describe("paymentSuccessApplyBlocker", () => {
  it("allows capture on an awaiting-payment order with an open payment", () => {
    assert.equal(
      paymentSuccessApplyBlocker({
        paymentStatus: "REQUIRES_ACTION",
        orderStatus: "AWAITING_PAYMENT",
      }),
      null,
    );
    assert.equal(
      paymentSuccessApplyBlocker({
        paymentStatus: "PENDING",
        orderStatus: "AWAITING_PAYMENT",
      }),
      null,
    );
    assert.equal(
      paymentSuccessApplyBlocker({
        paymentStatus: "FAILED",
        orderStatus: "AWAITING_PAYMENT",
      }),
      null,
    );
  });

  it("treats an already-succeeded payment as idempotent", () => {
    const result = paymentSuccessApplyBlocker({
      paymentStatus: "SUCCEEDED",
      orderStatus: "PAID",
    });
    assert.deepEqual(result, { kind: "already_succeeded" });
  });

  it("blocks capture after unpaid cancel cancelled the payment", () => {
    const result = paymentSuccessApplyBlocker({
      paymentStatus: "CANCELLED",
      orderStatus: "CANCELLED",
    });
    assert.deepEqual(result, {
      kind: "blocked",
      error: PAYMENT_ALREADY_TERMINAL_ERROR,
    });
  });

  it("blocks capture from resurrecting a cancelled order while payment is still open", () => {
    const result = paymentSuccessApplyBlocker({
      paymentStatus: "REQUIRES_ACTION",
      orderStatus: "CANCELLED",
    });
    assert.deepEqual(result, {
      kind: "blocked",
      error: PAYMENT_SUCCESS_ORDER_NOT_AWAITING_ERROR,
    });
  });

  it("blocks capture on an already-paid or completed order for a different attempt", () => {
    const paid = paymentSuccessApplyBlocker({
      paymentStatus: "REQUIRES_ACTION",
      orderStatus: "PAID",
    });
    assert.deepEqual(paid, {
      kind: "blocked",
      error: PAYMENT_SUCCESS_ORDER_NOT_AWAITING_ERROR,
    });
    const completed = paymentSuccessApplyBlocker({
      paymentStatus: "PENDING",
      orderStatus: "COMPLETED",
    });
    assert.deepEqual(completed, {
      kind: "blocked",
      error: PAYMENT_SUCCESS_ORDER_NOT_AWAITING_ERROR,
    });
  });

  it("blocks capture on a refunded payment", () => {
    const result = paymentSuccessApplyBlocker({
      paymentStatus: "REFUNDED",
      orderStatus: "CANCELLED",
    });
    assert.deepEqual(result, {
      kind: "blocked",
      error: PAYMENT_ALREADY_TERMINAL_ERROR,
    });
  });
});

describe("paymentStatusesEligibleForSuccess", () => {
  it("does not include CANCELLED so unpaid cancel cannot be overwritten", () => {
    assert.deepEqual(paymentStatusesEligibleForSuccess(), [
      "PENDING",
      "REQUIRES_ACTION",
      "FAILED",
    ]);
  });
});

describe("orderStatusWhereForCancelCommit", () => {
  it("locks unpaid cancel to AWAITING_PAYMENT so a concurrent capture cannot be cancelled without a refund", () => {
    assert.deepEqual(orderStatusWhereForCancelCommit("pre_payment"), {
      status: "AWAITING_PAYMENT",
    });
  });

  it("locks paid cancel and seller-abandon to PAID", () => {
    assert.deepEqual(orderStatusWhereForCancelCommit("buyer_refund"), {
      status: "PAID",
    });
    assert.deepEqual(
      orderStatusWhereForCancelCommit("seller_abandon_entitlement"),
      { status: "PAID" },
    );
  });
});
