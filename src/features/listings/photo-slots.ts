/**
 * @file photo-slots.ts
 * @description Helpers that map listing gallery images onto guided photo slots.
 * @dependencies @/features/listings/types
 */

import {
  LISTING_PHOTO_SLOTS,
  MAX_LISTING_GALLERY_PHOTOS,
} from "@/features/listings/types";

/** First extra photo uses this displayOrder (guided slots occupy 0–7). */
export const FIRST_EXTRA_DISPLAY_ORDER = LISTING_PHOTO_SLOTS.length;

type OrderedImage = {
  displayOrder: number;
};

/**
 * parseGallerySlotIndex
 *
 * Reads a gallery slot index from FormData. Rejects non-integers and values
 * outside the 0…MAX-1 range.
 *
 * @param value - Raw `slotIndex` field from the upload form.
 * @returns Slot index, or null when the value is missing or invalid.
 * @calledBy uploadListingGalleryAction
 * @consumers GalleryUploadForm via FormData
 */
export function parseGallerySlotIndex(
  value: FormDataEntryValue | null,
): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }

  const index = Number.parseInt(value, 10);
  if (index < 0 || index >= MAX_LISTING_GALLERY_PHOTOS) {
    return null;
  }

  return index;
}

/**
 * galleryImageByDisplayOrder
 *
 * Indexes gallery images by `displayOrder` so slots can look up a photo
 * without assuming contiguous 0…n packing.
 *
 * @param images - Gallery images (any extra fields preserved).
 * @returns Map of displayOrder → image.
 * @calledBy guidedSlotFillCount, nextEmptyGuidedSlotIndex, extraGalleryImages
 */
export function galleryImageByDisplayOrder<T extends OrderedImage>(
  images: T[],
): Map<number, T> {
  const byOrder = new Map<number, T>();
  for (const image of images) {
    byOrder.set(image.displayOrder, image);
  }
  return byOrder;
}

/**
 * guidedSlotFillCount
 *
 * Counts how many of the eight guided slots currently have a photo.
 *
 * @param images - Gallery images for one listing.
 * @returns Number of filled guided slots (0–8).
 * @calledBy GalleryUploadForm, continueFromPhotosAction, submitListingForReviewAction
 */
export function guidedSlotFillCount(images: OrderedImage[]): number {
  const byOrder = galleryImageByDisplayOrder(images);
  let filled = 0;
  for (let index = 0; index < LISTING_PHOTO_SLOTS.length; index += 1) {
    if (byOrder.has(index)) {
      filled += 1;
    }
  }
  return filled;
}

/**
 * isGuidedGalleryComplete
 *
 * Returns whether every required guided slot has a photo.
 *
 * @param images - Gallery images for one listing.
 * @returns True when slots 0–7 are all filled.
 * @calledBy continueFromPhotosAction, submitListingForReviewAction, GalleryUploadForm
 */
export function isGuidedGalleryComplete(images: OrderedImage[]): boolean {
  return guidedSlotFillCount(images) >= LISTING_PHOTO_SLOTS.length;
}

/**
 * nextEmptyGuidedSlotIndex
 *
 * Finds the first guided slot without a photo so the UI can highlight
 * “Siguiente”.
 *
 * @param images - Gallery images for one listing.
 * @returns Slot index 0–7, or null when every guided slot is filled.
 * @calledBy GalleryUploadForm
 */
export function nextEmptyGuidedSlotIndex(
  images: OrderedImage[],
): number | null {
  const byOrder = galleryImageByDisplayOrder(images);
  for (let index = 0; index < LISTING_PHOTO_SLOTS.length; index += 1) {
    if (!byOrder.has(index)) {
      return index;
    }
  }
  return null;
}

/**
 * extraGalleryImages
 *
 * Returns optional extra photos (displayOrder ≥ 8), sorted for display.
 *
 * @param images - Gallery images for one listing.
 * @returns Extra images in display order.
 * @calledBy GalleryUploadForm
 */
export function extraGalleryImages<T extends OrderedImage>(images: T[]): T[] {
  return images
    .filter((image) => image.displayOrder >= FIRST_EXTRA_DISPLAY_ORDER)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * nextExtraSlotIndex
 *
 * Finds the next empty extra slot after the eight guided angles.
 *
 * @param images - Gallery images for one listing.
 * @returns Slot index 8–11, or null when extras are full.
 * @calledBy GalleryUploadForm
 */
export function nextExtraSlotIndex(images: OrderedImage[]): number | null {
  const byOrder = galleryImageByDisplayOrder(images);
  for (
    let index = FIRST_EXTRA_DISPLAY_ORDER;
    index < MAX_LISTING_GALLERY_PHOTOS;
    index += 1
  ) {
    if (!byOrder.has(index)) {
      return index;
    }
  }
  return null;
}
