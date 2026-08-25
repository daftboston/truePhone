/**
 * @file photo-slots.test.ts
 * @description Unit tests for guided listing photo slot constants and mapping helpers.
 * @dependencies node:test, node:assert/strict, listing photo-slots and types
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extraGalleryImages,
  guidedSlotFillCount,
  isGuidedGalleryComplete,
  nextEmptyGuidedSlotIndex,
  nextExtraSlotIndex,
  parseGallerySlotIndex,
} from "@/features/listings/photo-slots";
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

  it("counts guided slots even when extras exist or orders have gaps", () => {
    const images = [
      { displayOrder: 0 },
      { displayOrder: 2 },
      { displayOrder: 8 },
    ];
    assert.equal(guidedSlotFillCount(images), 2);
    assert.equal(isGuidedGalleryComplete(images), false);
    assert.equal(nextEmptyGuidedSlotIndex(images), 1);
    assert.deepEqual(
      extraGalleryImages(images).map((image) => image.displayOrder),
      [8],
    );
  });

  it("treats all eight guided slots as complete before extras", () => {
    const images = Array.from({ length: 8 }, (_, displayOrder) => ({
      displayOrder,
    }));
    assert.equal(isGuidedGalleryComplete(images), true);
    assert.equal(nextEmptyGuidedSlotIndex(images), null);
    assert.equal(nextExtraSlotIndex(images), 8);
  });

  it("finds the next extra slot after a gap in extras", () => {
    const images = [
      ...Array.from({ length: 8 }, (_, displayOrder) => ({ displayOrder })),
      { displayOrder: 9 },
    ];
    assert.equal(nextExtraSlotIndex(images), 8);
  });

  it("parses valid gallery slot indexes and rejects junk", () => {
    assert.equal(parseGallerySlotIndex("0"), 0);
    assert.equal(parseGallerySlotIndex("11"), 11);
    assert.equal(parseGallerySlotIndex("12"), null);
    assert.equal(parseGallerySlotIndex("-1"), null);
    assert.equal(parseGallerySlotIndex("1.5"), null);
    assert.equal(parseGallerySlotIndex("front"), null);
    assert.equal(parseGallerySlotIndex(null), null);
  });
});
