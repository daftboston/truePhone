/**
 * @file order-support-queue.test.ts
 * @description Unit tests for staff order-support queue tab tallies.
 * @dependencies node:test, node:assert/strict, @/lib/orders/order-support-queue
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parseOrderSupportQueueTab,
  tallyOrderSupportQueueCounts,
} from "@/lib/orders/order-support-queue";

describe("tallyOrderSupportQueueCounts", () => {
  it("starts at zero when there are no cases", () => {
    assert.deepEqual(tallyOrderSupportQueueCounts([]), {
      pendientes: 0,
      revision: 0,
      vendedor: 0,
      escaladas: 0,
      resueltas: 0,
    });
  });

  it("maps each active status to its tab", () => {
    assert.deepEqual(
      tallyOrderSupportQueueCounts([
        { status: "PENDING", count: 3 },
        { status: "IN_REVIEW", count: 1 },
        { status: "NEEDS_SELLER_RESPONSE", count: 4 },
        { status: "ESCALATED", count: 2 },
      ]),
      {
        pendientes: 3,
        revision: 1,
        vendedor: 4,
        escaladas: 2,
        resueltas: 0,
      },
    );
  });

  it("sums resolved statuses onto resueltas", () => {
    assert.deepEqual(
      tallyOrderSupportQueueCounts([
        { status: "APPROVED", count: 1 },
        { status: "REJECTED", count: 2 },
        { status: "RESOLVED", count: 3 },
        { status: "WITHDRAWN", count: 4 },
      ]),
      {
        pendientes: 0,
        revision: 0,
        vendedor: 0,
        escaladas: 0,
        resueltas: 10,
      },
    );
  });
});

describe("parseOrderSupportQueueTab", () => {
  it("falls back to pendientes for missing or unknown tabs", () => {
    assert.equal(parseOrderSupportQueueTab(undefined), "pendientes");
    assert.equal(parseOrderSupportQueueTab("nope"), "pendientes");
  });

  it("keeps a valid tab id", () => {
    assert.equal(parseOrderSupportQueueTab("escaladas"), "escaladas");
  });
});
