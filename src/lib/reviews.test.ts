/**
 * @file reviews.test.ts
 * @description Unit tests for review reputation helpers and createReviewSchema.
 * @dependencies node:test, @/lib/reviews, @/features/reviews/schemas/review
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  computeAverageRating,
  otherPartyId,
  shouldBeTrustedSeller,
  TRUSTED_SELLER_MIN_RATING,
  TRUSTED_SELLER_MIN_REVIEWS,
} from "@/lib/reviews";
import { createReviewSchema } from "@/features/reviews/schemas/review";

describe("computeAverageRating", () => {
  it("returns 0 for empty ratings", () => {
    assert.equal(computeAverageRating([]), 0);
  });

  it("rounds to one decimal", () => {
    assert.equal(computeAverageRating([5, 4, 5]), 4.7);
    assert.equal(computeAverageRating([5, 5, 5]), 5);
  });
});

describe("shouldBeTrustedSeller", () => {
  it("requires min reviews and rating", () => {
    assert.equal(
      shouldBeTrustedSeller({
        totalReviews: TRUSTED_SELLER_MIN_REVIEWS - 1,
        sellerRating: 5,
      }),
      false,
    );
    assert.equal(
      shouldBeTrustedSeller({
        totalReviews: TRUSTED_SELLER_MIN_REVIEWS,
        sellerRating: TRUSTED_SELLER_MIN_RATING - 0.1,
      }),
      false,
    );
    assert.equal(
      shouldBeTrustedSeller({
        totalReviews: TRUSTED_SELLER_MIN_REVIEWS,
        sellerRating: TRUSTED_SELLER_MIN_RATING,
      }),
      true,
    );
  });
});

describe("otherPartyId", () => {
  const order = { buyerId: "buyer", sellerId: "seller" };

  it("maps buyer to seller and seller to buyer", () => {
    assert.equal(otherPartyId(order, "buyer"), "seller");
    assert.equal(otherPartyId(order, "seller"), "buyer");
  });

  it("rejects outsiders", () => {
    assert.equal(otherPartyId(order, "other"), null);
  });
});

describe("createReviewSchema", () => {
  it("accepts a valid rating and trims comment", () => {
    const parsed = createReviewSchema.safeParse({
      orderId: "ord_1",
      rating: "5",
      comment: "  Excelente  ",
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.rating, 5);
      assert.equal(parsed.data.comment, "Excelente");
    }
  });

  it("rejects out-of-range ratings", () => {
    const parsed = createReviewSchema.safeParse({
      orderId: "ord_1",
      rating: 6,
    });
    assert.equal(parsed.success, false);
  });
});
