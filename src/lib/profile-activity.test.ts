/**
 * @file profile-activity.test.ts
 * @description Unit tests for public activity count rules and Spanish strip copy.
 * @dependencies node:test, @/lib/profile-activity
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
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
    });
  });
});

describe("formatPublicActivityLabel", () => {
  it("matches the locked Spanish trust-strip copy", () => {
    assert.equal(
      formatPublicActivityLabel({
        total: 3,
        active: 0,
        bought: 1,
      }),
      "Anuncios: 3 en total, 0 activos, 1 comprado",
    );
  });
});
