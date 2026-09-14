/**
 * @file order-support.test.ts
 * @description Unit tests for order-support notification dedupe keys.
 * @dependencies node:test, node:assert, order-support notifications
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  orderSupportReplyDedupeKey,
  orderSupportStatusDedupeKey,
} from "@/lib/notifications/order-support";

describe("order-support notification dedupe keys", () => {
  it("separates staff and seller deliveries for the same message", () => {
    assert.equal(
      orderSupportReplyDedupeKey("staff", "message-1"),
      "order-support-staff-reply:message-1",
    );
    assert.equal(
      orderSupportReplyDedupeKey("seller", "message-1"),
      "order-support-seller-reply:message-1",
    );
  });

  it("stays stable for one persisted status transition", () => {
    assert.equal(
      orderSupportStatusDedupeKey("case-1", "NEEDS_SELLER_RESPONSE:123"),
      "order-support-status:case-1:NEEDS_SELLER_RESPONSE:123",
    );
  });
});
