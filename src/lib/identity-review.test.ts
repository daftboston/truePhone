/**
 * @file identity-review.test.ts
 * @description Unit tests for identity reviewer queue mapping and decision gates.
 * @dependencies node:test, node:assert/strict, @/lib/auth/identity
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canDecideIdentityReview,
  identityQueueTabForVerification,
  identityReviewStatusBadgeVariant,
  identityReviewStatusLabel,
  parseIdentityReviewTab,
} from "@/lib/auth/identity";

describe("parseIdentityReviewTab", () => {
  it("defaults unknown values to pendiente", () => {
    assert.equal(parseIdentityReviewTab(undefined), "pendiente");
    assert.equal(parseIdentityReviewTab("todos"), "pendiente");
  });

  it("accepts known tabs", () => {
    assert.equal(parseIdentityReviewTab("en_revision"), "en_revision");
    assert.equal(parseIdentityReviewTab("rechazados"), "rechazados");
  });
});

describe("identityQueueTabForVerification", () => {
  it("puts unclaimed PENDING and IN_REVIEW in pendiente", () => {
    assert.equal(
      identityQueueTabForVerification({
        status: "PENDING",
        reviewerId: null,
      }),
      "pendiente",
    );
    assert.equal(
      identityQueueTabForVerification({
        status: "IN_REVIEW",
        reviewerId: null,
      }),
      "pendiente",
    );
  });

  it("puts claimed active cases in en_revision", () => {
    assert.equal(
      identityQueueTabForVerification({
        status: "IN_REVIEW",
        reviewerId: "rev-1",
      }),
      "en_revision",
    );
  });

  it("maps verified and rejected history", () => {
    assert.equal(
      identityQueueTabForVerification({
        status: "VERIFIED",
        reviewerId: "rev-1",
      }),
      "aprobados",
    );
    assert.equal(
      identityQueueTabForVerification({
        status: "REJECTED",
        reviewerId: "rev-1",
      }),
      "rechazados",
    );
  });

  it("ignores drafts", () => {
    assert.equal(
      identityQueueTabForVerification({ status: "DRAFT", reviewerId: null }),
      null,
    );
  });
});

describe("identityReviewStatusLabel", () => {
  it("labels unclaimed IN_REVIEW as Pendiente", () => {
    assert.equal(
      identityReviewStatusLabel({ status: "IN_REVIEW", reviewerId: null }),
      "Pendiente",
    );
  });
});

describe("identityReviewStatusBadgeVariant", () => {
  it("maps pending and rejected labels to Badge variants", () => {
    assert.equal(
      identityReviewStatusBadgeVariant({
        status: "PENDING",
        reviewerId: null,
      }),
      "warning",
    );
    assert.equal(
      identityReviewStatusBadgeVariant({
        status: "IN_REVIEW",
        reviewerId: "rev-1",
      }),
      "secondary",
    );
    assert.equal(
      identityReviewStatusBadgeVariant({
        status: "REJECTED",
        reviewerId: "rev-1",
      }),
      "destructive",
    );
  });
});

describe("canDecideIdentityReview", () => {
  it("allows the claimer and unclaimed cases", () => {
    assert.equal(
      canDecideIdentityReview({
        status: "PENDING",
        reviewerId: null,
        actorId: "rev-1",
        actorRole: "REVIEWER",
      }),
      true,
    );
    assert.equal(
      canDecideIdentityReview({
        status: "IN_REVIEW",
        reviewerId: "rev-1",
        actorId: "rev-1",
        actorRole: "REVIEWER",
      }),
      true,
    );
  });

  it("blocks a second reviewer unless ADMIN", () => {
    assert.equal(
      canDecideIdentityReview({
        status: "IN_REVIEW",
        reviewerId: "rev-1",
        actorId: "rev-2",
        actorRole: "REVIEWER",
      }),
      false,
    );
    assert.equal(
      canDecideIdentityReview({
        status: "IN_REVIEW",
        reviewerId: "rev-1",
        actorId: "admin-1",
        actorRole: "ADMIN",
      }),
      true,
    );
  });

  it("rejects decided cases", () => {
    assert.equal(
      canDecideIdentityReview({
        status: "VERIFIED",
        reviewerId: "rev-1",
        actorId: "rev-1",
        actorRole: "REVIEWER",
      }),
      false,
    );
  });
});
