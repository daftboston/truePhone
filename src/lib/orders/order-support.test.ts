/**
 * @file order-support.test.ts
 * @description Verifies contextual seller support options across order and shipping states.
 * @dependencies node:test, node:assert, order-support
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyOrderSupportOptions,
  type OrderSupportSnapshot,
} from "./order-support";

/**
 * snapshot
 *
 * Builds a paid, uncommitted order and applies test-specific overrides.
 *
 * @param overrides - Partial order state used by one test.
 * @returns Complete support classifier snapshot.
 * @calledBy support-option matrix tests
 */
function snapshot(
  overrides: Partial<OrderSupportSnapshot> = {},
): OrderSupportSnapshot {
  return {
    status: "PAID",
    payoutCompletedAt: null,
    payoutAuthorizedAt: null,
    buyerConfirmedAt: null,
    buyerConfirmDeadlineAt: null,
    shipment: null,
    ...overrides,
  };
}

test("unpaid orders keep contextual paid support hidden", () => {
  const result = classifyOrderSupportOptions(
    snapshot({ status: "AWAITING_PAYMENT" }),
  );

  assert.equal(result.cancellation.allowed, false);
  assert.equal(result.fulfillmentException.allowed, false);
  assert.equal(result.generalSupport.allowed, false);
});

test("paid uncommitted orders allow a cancellation request", () => {
  const result = classifyOrderSupportOptions(snapshot());

  assert.equal(result.cancellation.allowed, true);
  assert.equal(result.fulfillmentException.allowed, false);
  assert.equal(result.generalSupport.allowed, true);
});

test("Carrier tracking replaces cancellation with fulfillment exception", () => {
  const result = classifyOrderSupportOptions(
    snapshot({
      shipment: {
        method: "CARRIER",
        status: "IN_TRANSIT",
        trackingCode: "SER-123",
        trackingUploadedAt: new Date("2026-08-26T12:00:00Z"),
        inspectionAt: null,
        deliveredAt: null,
        inspection: null,
      },
    }),
  );

  assert.equal(result.fulfillmentCommitted, true);
  assert.equal(result.cancellation.allowed, false);
  assert.equal(result.fulfillmentException.allowed, true);
});

test("Premium inspection commitment replaces cancellation", () => {
  const result = classifyOrderSupportOptions(
    snapshot({
      shipment: {
        method: "PREMIUM_BOGOTA",
        status: "INSPECTION",
        trackingCode: null,
        trackingUploadedAt: null,
        inspectionAt: new Date("2026-08-26T12:00:00Z"),
        deliveredAt: null,
        inspection: { result: "PENDING" },
      },
    }),
  );

  assert.equal(result.cancellation.allowed, false);
  assert.equal(result.fulfillmentException.allowed, true);
});

test("buyer receipt hands device claims to dispute flow", () => {
  const result = classifyOrderSupportOptions(
    snapshot({
      buyerConfirmDeadlineAt: new Date("2026-08-27T12:00:00Z"),
      shipment: {
        method: "CARRIER",
        status: "DELIVERED",
        trackingCode: "SER-123",
        trackingUploadedAt: new Date("2026-08-25T12:00:00Z"),
        inspectionAt: null,
        deliveredAt: new Date("2026-08-26T12:00:00Z"),
        inspection: null,
      },
    }),
  );

  assert.equal(result.cancellation.allowed, false);
  assert.equal(result.fulfillmentException.allowed, false);
  assert.equal(result.generalSupport.allowed, true);
  assert.equal(result.buyerDisputeHandoff, true);
});

test("payout authorization leaves general support only", () => {
  const result = classifyOrderSupportOptions(
    snapshot({ payoutAuthorizedAt: new Date("2026-08-26T12:00:00Z") }),
  );

  assert.equal(result.cancellation.allowed, false);
  assert.equal(result.fulfillmentException.allowed, false);
  assert.equal(result.generalSupport.allowed, true);
  assert.equal(result.buyerDisputeHandoff, true);
});
