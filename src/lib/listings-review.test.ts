/**
 * @file listings-review.test.ts
 * @description Unit tests for reviewer queue tab mapping, including SUBMITTED.
 * @dependencies node:test, node:assert/strict, @/lib/listings-review
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatQueueWait,
  matchesListingQueueQuery,
  reviewQueueTabForListing,
  reviewStatusBadgeVariant,
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

describe("matchesListingQueueQuery", () => {
  const listing = {
    title: "iPhone 16 Pro 256",
    seller: { fullName: "Ana Pérez", username: "ana" },
    reviewer: { fullName: "Diego", username: "reviewer" },
  };

  it("matches title, seller, or assignee", () => {
    assert.equal(matchesListingQueueQuery(listing, ""), true);
    assert.equal(matchesListingQueueQuery(listing, "16 pro"), true);
    assert.equal(matchesListingQueueQuery(listing, "diego"), true);
    assert.equal(matchesListingQueueQuery(listing, "pixel"), false);
  });
});

describe("formatQueueWait", () => {
  it("uses hours then days", () => {
    const now = new Date("2026-09-12T12:00:00.000Z");
    assert.equal(
      formatQueueWait(new Date("2026-09-12T11:30:00.000Z"), now),
      "Hace menos de 1 h",
    );
    assert.equal(
      formatQueueWait(new Date("2026-09-12T09:00:00.000Z"), now),
      "Hace 3 h",
    );
    assert.equal(
      formatQueueWait(new Date("2026-09-10T12:00:00.000Z"), now),
      "Hace 2 días",
    );
  });
});

describe("reviewStatusBadgeVariant", () => {
  it("maps pending and rejected queue labels to Badge variants", () => {
    assert.equal(
      reviewStatusBadgeVariant({ status: "SUBMITTED", reviewerId: null }),
      "warning",
    );
    assert.equal(
      reviewStatusBadgeVariant({
        status: "PENDING_REVIEW",
        reviewerId: "rev-1",
      }),
      "secondary",
    );
    assert.equal(
      reviewStatusBadgeVariant({ status: "REJECTED", reviewerId: "rev-1" }),
      "destructive",
    );
  });
});
