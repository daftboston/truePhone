/**
 * @file listings-review.test.ts
 * @description Unit tests for reviewer queue tab mapping, including SUBMITTED.
 * @dependencies node:test, node:assert/strict, @/lib/listings-review
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  reviewQueueTabForListing,
  reviewStatusLabel,
} from "@/lib/listings-review";

describe("reviewQueueTabForListing", () => {
  it("puts unclaimed SUBMITTED and PENDING_REVIEW in pendiente", () => {
    assert.equal(
      reviewQueueTabForListing({ status: "SUBMITTED", reviewerId: null }),
      "pendiente",
    );
    assert.equal(
      reviewQueueTabForListing({
        status: "PENDING_REVIEW",
        reviewerId: null,
      }),
      "pendiente",
    );
  });

  it("puts claimed active listings in en_revision", () => {
    assert.equal(
      reviewQueueTabForListing({
        status: "PENDING_REVIEW",
        reviewerId: "rev-1",
      }),
      "en_revision",
    );
  });

  it("does not hide rejected listings from history", () => {
    assert.equal(
      reviewQueueTabForListing({ status: "REJECTED", reviewerId: "rev-1" }),
      "rechazados",
    );
  });

  it("ignores drafts still being edited after a reopen", () => {
    assert.equal(
      reviewQueueTabForListing({ status: "DRAFT", reviewerId: "rev-1" }),
      null,
    );
  });
});

describe("reviewStatusLabel", () => {
  it("labels SUBMITTED as Pendiente until a reviewer claims it", () => {
    assert.equal(
      reviewStatusLabel({ status: "SUBMITTED", reviewerId: null }),
      "Pendiente",
    );
  });
});
