/**
 * @file review-wait-copy.test.ts
 * @description Unit tests for seller-facing review wait copy.
 * @dependencies node:test, node:assert/strict, ./review-wait-copy
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  kycSubmittedDescription,
  listingPendingReviewDescription,
  listingSubmittedDescription,
  MANUAL_REVIEW_ETA,
} from "./review-wait-copy";

describe("review wait copy", () => {
  it("gives an estimated review window, not only arrival order", () => {
    assert.match(MANUAL_REVIEW_ETA, /día hábil/);
  });

  it("tells sellers they will hear by email and in-app", () => {
    assert.match(listingSubmittedDescription(), /correo/);
    assert.match(listingSubmittedDescription(), /Notificaciones/);
    assert.match(listingPendingReviewDescription(), /correo/);
    assert.match(kycSubmittedDescription(), /correo/);
  });
});
