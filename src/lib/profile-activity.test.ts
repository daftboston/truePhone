/**
 * @file profile-activity.test.ts
 * @description Unit tests for public activity count rules and Spanish strip copy.
 * @dependencies node:test, @/lib/profile-activity
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatPaidSellerCancelLabel,
  formatPublicActivityLabel,
  summarizePublicActivity,
} from "@/lib/profile-activity";

describe("summarizePublicActivity", () => {
  it("excludes drafts from total and active", () => {
    const counts = summarizePublicActivity({
      listingStatuses: ["DRAFT", "PUBLISHED", "SOLD", "SUBMITTED"],
      bought: 2,
    });
    assert.deepEqual(counts, {
      total: 3,
      active: 1,
      bought: 2,
      paidSellerCancelCount: 0,
    });
  });

  it("counts only PUBLISHED as active", () => {
    const counts = summarizePublicActivity({
      listingStatuses: ["RESERVED", "PENDING_REVIEW", "APPROVED"],
      bought: 0,
    });
    assert.deepEqual(counts, {
      total: 3,
      active: 0,
      bought: 0,
      paidSellerCancelCount: 0,
    });
  });

  it("passes through paidSellerCancelCount when provided", () => {
    const counts = summarizePublicActivity({
      listingStatuses: ["PUBLISHED"],
      bought: 0,
      paidSellerCancelCount: 2,
    });
    assert.equal(counts.paidSellerCancelCount, 2);
  });
});

describe("formatPublicActivityLabel", () => {
  it("matches the locked Spanish trust-strip copy", () => {
    assert.equal(
      formatPublicActivityLabel({
        total: 3,
        active: 0,
        bought: 1,
        paidSellerCancelCount: 0,
      }),
      "Anuncios: 3 en total, 0 activos, 1 comprado",
    );
  });
});

describe("formatPaidSellerCancelLabel", () => {
  it("returns null when count is zero or negative", () => {
    assert.equal(formatPaidSellerCancelLabel(0), null);
    assert.equal(formatPaidSellerCancelLabel(-1), null);
  });

  it("matches the Spanish paid seller-cancel trust copy", () => {
    assert.equal(formatPaidSellerCancelLabel(2), "Cancelaciones tras pago: 2");
  });
});
