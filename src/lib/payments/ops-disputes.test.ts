/**
 * @file ops-disputes.test.ts
 * @description Unit tests for ops dispute classification and refund reason defaults.
 * @dependencies node:test, @/lib/payments/ops-disputes
 */

import type { LedgerEntryType } from "@prisma/client";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyOpsDisputeCase,
  defaultRefundReasonForKind,
  type OpsDisputeOrder,
} from "@/lib/payments/ops-disputes";

/**
 * orderFixture
 *
 * Builds a minimal OpsDisputeOrder for classifier tests.
 *
 * @param input - Partial order fields used by classifyOpsDisputeCase.
 * @returns Cast OpsDisputeOrder.
 */
function orderFixture(
  input: {
    payoutCompletedAt?: Date | null;
    inspectionResult?: string | null;
    ledgerTypes?: LedgerEntryType[];
  } = {},
): OpsDisputeOrder {
  return {
    payoutCompletedAt: input.payoutCompletedAt ?? null,
    shipment: input.inspectionResult
      ? {
          method: "PREMIUM_BOGOTA",
          status: "FAILED",
          inspection: { result: input.inspectionResult },
        }
      : null,
    ledgerEntries: (input.ledgerTypes ?? []).map((type, index) => ({
      id: `le-${index}`,
      type,
      amountPesos: 1,
      memo: type,
      createdAt: new Date(),
      paymentId: null,
    })),
  } as unknown as OpsDisputeOrder;
}

describe("classifyOpsDisputeCase", () => {
  it("labels post-payout chargebacks as absorbed pending", () => {
    const result = classifyOpsDisputeCase(
      orderFixture({
        payoutCompletedAt: new Date(),
        ledgerTypes: ["CHARGEBACK_RECEIVED"],
      }),
    );
    assert.equal(result.kind, "absorbed_pending");
  });

  it("labels pre-payout chargebacks as chargeback", () => {
    const result = classifyOpsDisputeCase(
      orderFixture({ ledgerTypes: ["CHARGEBACK_RECEIVED"] }),
    );
    assert.equal(result.kind, "chargeback");
  });

  it("labels failed Premium inspection", () => {
    const result = classifyOpsDisputeCase(
      orderFixture({ inspectionResult: "FAILED" }),
    );
    assert.equal(result.kind, "premium_fail");
  });

  it("labels buyer reports from DISPUTE_OPENED", () => {
    const result = classifyOpsDisputeCase(
      orderFixture({ ledgerTypes: ["DISPUTE_OPENED"] }),
    );
    assert.equal(result.kind, "buyer_report");
  });

  it("falls back to frozen", () => {
    const result = classifyOpsDisputeCase(orderFixture());
    assert.equal(result.kind, "frozen");
  });
});

describe("defaultRefundReasonForKind", () => {
  it("maps classification to locked refund reasons", () => {
    assert.equal(
      defaultRefundReasonForKind("premium_fail"),
      "PREMIUM_INSPECTION_FAILED",
    );
    assert.equal(
      defaultRefundReasonForKind("chargeback"),
      "CHARGEBACK_RECONCILE",
    );
    assert.equal(
      defaultRefundReasonForKind("buyer_report"),
      "DISPUTE_BUYER_WIN",
    );
    assert.equal(defaultRefundReasonForKind("frozen"), "MANUAL");
  });
});
