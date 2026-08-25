/**
 * @file photo-slots.test.ts
 * @description Unit tests for guided listing photo slot constants and helpers.
 * @dependencies node:test, node:assert/strict, @/features/listings/types
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extraGalleryImages,
  galleryImageAtOrder,
  guidedSlotFillCount,
  isGuidedGalleryComplete,
  isGuidedSlotIndex,
  isValidGalleryDisplayOrder,
  LISTING_EXTRA_PHOTO_START,
  LISTING_PHOTO_SLOTS,
  MAX_LISTING_GALLERY_PHOTOS,
  MIN_LISTING_GALLERY_PHOTOS,
  nextEmptyGuidedSlotIndex,
  nextExtraDisplayOrder,
} from "@/features/listings/types";

describe("listing photo slots", () => {
  it("requires one photo per guided slot", () => {
    assert.equal(MIN_LISTING_GALLERY_PHOTOS, LISTING_PHOTO_SLOTS.length);
    assert.equal(MIN_LISTING_GALLERY_PHOTOS, 8);
    assert.equal(LISTING_EXTRA_PHOTO_START, 8);
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

describe("gallery slot indexes", () => {
  it("treats 0..7 as guided and 8..11 as extras", () => {
    assert.equal(isGuidedSlotIndex(0), true);
    assert.equal(isGuidedSlotIndex(7), true);
    assert.equal(isGuidedSlotIndex(8), false);
    assert.equal(isValidGalleryDisplayOrder(11), true);
    assert.equal(isValidGalleryDisplayOrder(12), false);
    assert.equal(isValidGalleryDisplayOrder(1.5), false);
  });

  it("finds a photo by displayOrder without shifting neighbors", () => {
    const images = [
      { id: "front", displayOrder: 0 },
      { id: "imei", displayOrder: 7 },
    ];
    assert.equal(galleryImageAtOrder(images, 0)?.id, "front");
    assert.equal(galleryImageAtOrder(images, 1), undefined);
    assert.equal(galleryImageAtOrder(images, 7)?.id, "imei");
  });

  it("counts unique guided slots and ignores extras", () => {
    const images = [
      { displayOrder: 0 },
      { displayOrder: 2 },
      { displayOrder: 8 },
    ];
    assert.equal(guidedSlotFillCount(images), 2);
    assert.equal(isGuidedGalleryComplete(images), false);
    assert.equal(nextEmptyGuidedSlotIndex(images), 1);
  });

  it("is complete only when every guided index exists", () => {
    const guided = LISTING_PHOTO_SLOTS.map((_, index) => ({
      displayOrder: index,
    }));
    assert.equal(isGuidedGalleryComplete(guided), true);
    assert.equal(nextEmptyGuidedSlotIndex(guided), null);
    assert.equal(guidedSlotFillCount([...guided, { displayOrder: 8 }]), 8);

    const eightExtrasOnly = Array.from({ length: 8 }, (_, index) => ({
      displayOrder: 8 + (index % 4),
    }));
    assert.equal(isGuidedGalleryComplete(eightExtrasOnly), false);
  });

  it("lists extras and picks the next free extra index", () => {
    const images = [
      { id: "a", displayOrder: 0 },
      { id: "extra", displayOrder: 8 },
      { id: "extra2", displayOrder: 10 },
    ];
    assert.deepEqual(
      extraGalleryImages(images).map((image) => image.id),
      ["extra", "extra2"],
    );
    assert.equal(nextExtraDisplayOrder(images), 9);
  });

  it("returns null when extra slots are full", () => {
    const images = [8, 9, 10, 11].map((displayOrder) => ({ displayOrder }));
    assert.equal(nextExtraDisplayOrder(images), null);
  });
});
