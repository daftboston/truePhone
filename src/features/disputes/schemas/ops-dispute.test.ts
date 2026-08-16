/**
 * @file ops-dispute.test.ts
 * @description Unit tests for admin chargeback / refund Zod schemas.
 * @dependencies node:test, ops-dispute schemas
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  authorizeOpsRefundSchema,
  recordChargebackSchema,
} from "@/features/disputes/schemas/ops-dispute";

describe("authorizeOpsRefundSchema", () => {
  it("accepts a locked reason and listing outcome", () => {
    const parsed = authorizeOpsRefundSchema.safeParse({
      orderId: "ord_1",
      reason: "PREMIUM_INSPECTION_FAILED",
      listingOutcome: "archive",
    });
    assert.equal(parsed.success, true);
  });

  it("rejects an unknown reason", () => {
    const parsed = authorizeOpsRefundSchema.safeParse({
      orderId: "ord_1",
      reason: "SELLER_WHIM",
    });
    assert.equal(parsed.success, false);
  });
});

describe("recordChargebackSchema", () => {
  it("coerces optional positive amount", () => {
    const parsed = recordChargebackSchema.safeParse({
      paymentId: "pay_1",
      amountPesos: "1500000",
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.amountPesos, 1_500_000);
    }
  });

  it("rejects a non-positive amount", () => {
    const parsed = recordChargebackSchema.safeParse({
      paymentId: "pay_1",
      amountPesos: "0",
    });
    assert.equal(parsed.success, false);
  });
});
