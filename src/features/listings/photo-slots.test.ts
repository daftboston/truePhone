/**
 * @file photo-slots.test.ts
 * @description Unit tests for guided listing photo slot constants.
 * @dependencies node:test, node:assert/strict, @/features/listings/types
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  LISTING_PHOTO_SLOTS,
  MAX_LISTING_GALLERY_PHOTOS,
  MIN_LISTING_GALLERY_PHOTOS,
} from "@/features/listings/types";

describe("listing photo slots", () => {
  it("requires one photo per guided slot", () => {
    assert.equal(MIN_LISTING_GALLERY_PHOTOS, LISTING_PHOTO_SLOTS.length);
    assert.equal(MIN_LISTING_GALLERY_PHOTOS, 8);
  });

  it("allows optional extras above the guided slots", () => {
    assert.equal(MAX_LISTING_GALLERY_PHOTOS, 12);
    assert.ok(MAX_LISTING_GALLERY_PHOTOS > MIN_LISTING_GALLERY_PHOTOS);
  });

  it("keeps slot ids unique so guides map 1:1", () => {
    const ids = LISTING_PHOTO_SLOTS.map((slot) => slot.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("gives every slot a title and a tip", () => {
    for (const slot of LISTING_PHOTO_SLOTS) {
      assert.ok(slot.title.length > 0, `${slot.id} needs a title`);
      assert.ok(slot.tip.length > 0, `${slot.id} needs a tip`);
    }
  });
});
