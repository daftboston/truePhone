/**
 * @file buyer-abandon-choice.test.ts
 * @description Unit tests for buyer refund vs 8% loyalty choice visibility.
 * @dependencies node:test, @/lib/financial-core/buyer-abandon-choice
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buyerCanChooseRefundOrLoyalty } from "@/lib/financial-core/buyer-abandon-choice";

describe("buyerCanChooseRefundOrLoyalty", () => {
  const active = { status: "ACTIVE" as const, expiresAt: null };

  it("shows the choice for the buyer on a cancelled order with an active entitlement", () => {
    assert.equal(
      buyerCanChooseRefundOrLoyalty({
        orderStatus: "CANCELLED",
        isBuyer: true,
        entitlement: active,
      }),
      true,
    );
  });

  it("hides the choice from the seller", () => {
    assert.equal(
      buyerCanChooseRefundOrLoyalty({
        orderStatus: "CANCELLED",
        isBuyer: false,
        entitlement: active,
      }),
      false,
    );
  });

  it("hides the choice after refund or use", () => {
    assert.equal(
      buyerCanChooseRefundOrLoyalty({
        orderStatus: "CANCELLED",
        isBuyer: true,
        entitlement: { status: "REFUNDED", expiresAt: null },
      }),
      false,
    );
    assert.equal(
      buyerCanChooseRefundOrLoyalty({
        orderStatus: "CANCELLED",
        isBuyer: true,
        entitlement: { status: "USED", expiresAt: null },
      }),
      false,
    );
  });

  it("hides expired entitlements", () => {
    assert.equal(
      buyerCanChooseRefundOrLoyalty({
        orderStatus: "CANCELLED",
        isBuyer: true,
        entitlement: {
          status: "ACTIVE",
          expiresAt: new Date("2020-01-01T00:00:00.000Z"),
        },
        now: new Date("2026-08-19T00:00:00.000Z"),
      }),
      false,
    );
  });
});
