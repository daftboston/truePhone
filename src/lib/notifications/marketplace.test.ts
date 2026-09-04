/**
 * @file marketplace.test.ts
 * @description Unit tests for Phase 12 marketplace notification dedupe keys.
 * @dependencies node:test, marketplace helpers
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  identityApprovedDedupeKey,
  identityRejectedDedupeKey,
  listingAnswerDedupeKey,
  listingApprovedDedupeKey,
  listingQuestionDedupeKey,
  listingRejectedDedupeKey,
  newMessageDedupeKey,
  orderPaidDedupeKey,
  payoutSentDedupeKey,
  shippingMethodDedupeKey,
  trackingUploadedDedupeKey,
} from "@/lib/notifications/marketplace";

describe("marketplace notification dedupe keys", () => {
  it("builds stable keys per resource", () => {
    assert.equal(listingApprovedDedupeKey("lst_1"), "listing-approved:lst_1");
    assert.equal(listingRejectedDedupeKey("lst_1"), "listing-rejected:lst_1");
    assert.equal(identityApprovedDedupeKey("ver_1"), "identity-approved:ver_1");
    assert.equal(identityRejectedDedupeKey("ver_1"), "identity-rejected:ver_1");
    assert.equal(orderPaidDedupeKey("ord_1"), "order-paid:ord_1");
    assert.equal(newMessageDedupeKey("msg_1"), "new-message:msg_1");
    assert.equal(
      shippingMethodDedupeKey("shp_1", "Premium Bogotá"),
      "shipping-method:shp_1:Premium Bogotá",
    );
    assert.equal(
      trackingUploadedDedupeKey("shp_1", "ABC123"),
      "tracking-uploaded:shp_1:ABC123",
    );
    assert.equal(payoutSentDedupeKey("ord_1"), "payout-sent:ord_1");
    assert.equal(listingQuestionDedupeKey("q_1"), "listing-question:q_1");
    assert.equal(listingAnswerDedupeKey("a_1"), "listing-answer:a_1");
  });
});
