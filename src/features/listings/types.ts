/**
 * @file types.ts
 * @description Shared types and helpers for the listings feature.
 * @dependencies none
 * @changelog 2026-08-25 — Slot-index helpers so gallery photos replace in place.
 */

export type ListingActionState =
  | {
      ok: true;
      message?: string;
      listingId?: string;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

export const LISTING_STEPS = [
  { id: "dispositivo", title: "Dispositivo", pathSuffix: "dispositivo" },
  { id: "fotos", title: "Fotos", pathSuffix: "fotos" },
  { id: "seguridad", title: "Seguridad", pathSuffix: "seguridad" },
  { id: "posesion", title: "Posesión", pathSuffix: "posesion" },
  { id: "revisar", title: "Revisar", pathSuffix: "revisar" },
] as const;

/**
 * Required gallery shots for a sell listing.
 * Eight guided slots cover the trust-critical angles (every body face buyers
 * inspect for damage, plus live screen, battery health, and IMEI).
 */
export const LISTING_PHOTO_SLOTS = [
  {
    id: "front",
    title: "Frente",
    tip: "iPhone de frente, buena luz, sin funda",
  },
  {
    id: "back",
    title: "Reverso",
    tip: "Cámara y carcasa completas",
  },
  {
    id: "left",
    title: "Lado izquierdo",
    tip: "Perfil izquierdo con botón de volumen",
  },
  {
    id: "right",
    title: "Lado derecho",
    tip: "Perfil derecho con botón lateral",
  },
  {
    id: "bottom",
    title: "Parte inferior",
    tip: "Puerto de carga y borde inferior",
  },
  {
    id: "screen",
    title: "Pantalla",
    tip: "Pantalla encendida, sin grietas ocultas",
  },
  {
    id: "battery",
    title: "Batería",
    tip: "Ajustes → Batería → Salud de la batería",
  },
  {
    id: "imei",
    title: "IMEI",
    tip: "Ajustes → General → Información → IMEI",
  },
] as const;

export type ListingPhotoSlotId = (typeof LISTING_PHOTO_SLOTS)[number]["id"];

/** Sellers must fill every guided slot before continuing. */
export const MIN_LISTING_GALLERY_PHOTOS = LISTING_PHOTO_SLOTS.length;

/**
 * Hard cap: the guided slots plus optional extra angles (PRD recommends 12+).
 * Deliberately larger than the slot count so extras are allowed, not an error.
 */
export const MAX_LISTING_GALLERY_PHOTOS = 12;

/** First displayOrder used by optional extra photos (after the eight guides). */
export const LISTING_EXTRA_PHOTO_START = LISTING_PHOTO_SLOTS.length;

type GalleryOrderImage = { displayOrder: number };

/**
 * isGuidedSlotIndex
 *
 * Returns whether a gallery displayOrder maps to one of the eight guides.
 *
 * @param displayOrder - ListingImage.displayOrder value.
 * @returns True for indexes 0..7.
 * @calledBy gallery upload action and slot helpers
 */
export function isGuidedSlotIndex(displayOrder: number): boolean {
  return (
    Number.isInteger(displayOrder) &&
    displayOrder >= 0 &&
    displayOrder < LISTING_PHOTO_SLOTS.length
  );
}

/**
 * galleryImageAtOrder
 *
 * Finds the gallery image stored at a slot or extra index.
 *
 * @param images - Gallery images for a listing.
 * @param displayOrder - Target slot index.
 * @returns The matching image, or undefined when that slot is empty.
 * @calledBy GalleryUploadForm, uploadListingGalleryAction
 */
export function galleryImageAtOrder<T extends GalleryOrderImage>(
  images: T[],
  displayOrder: number,
): T | undefined {
  return images.find((image) => image.displayOrder === displayOrder);
}

/**
 * guidedSlotFillCount
 *
 * Counts unique guided slots that already have a photo.
 *
 * @param images - Gallery images for a listing.
 * @returns Number of filled guides (0..8).
 * @calledBy GalleryUploadForm progress
 */
export function guidedSlotFillCount(images: GalleryOrderImage[]): number {
  const filled = new Set<number>();
  for (const image of images) {
    if (isGuidedSlotIndex(image.displayOrder)) {
      filled.add(image.displayOrder);
    }
  }
  return filled.size;
}

/**
 * isGuidedGalleryComplete
 *
 * Returns whether every guided slot (displayOrder 0..7) has a photo.
 * A raw count of 8 is not enough: extras must not mask a missing angle.
 *
 * @param images - Gallery images for a listing.
 * @returns True when Frente through IMEI are all present.
 * @calledBy continueFromPhotosAction, submitListingForReviewAction
 */
export function isGuidedGalleryComplete(images: GalleryOrderImage[]): boolean {
  return LISTING_PHOTO_SLOTS.every((_, index) =>
    images.some((image) => image.displayOrder === index),
  );
}

/**
 * nextEmptyGuidedSlotIndex
 *
 * Returns the first guided slot that still needs a photo.
 *
 * @param images - Gallery images for a listing.
 * @returns Slot index 0..7, or null when all guides are filled.
 * @calledBy GalleryUploadForm highlight
 */
export function nextEmptyGuidedSlotIndex(
  images: GalleryOrderImage[],
): number | null {
  for (let index = 0; index < LISTING_PHOTO_SLOTS.length; index += 1) {
    if (!images.some((image) => image.displayOrder === index)) {
      return index;
    }
  }
  return null;
}

/**
 * extraGalleryImages
 *
 * Lists optional extras (displayOrder 8+) in display order.
 *
 * @param images - Gallery images for a listing.
 * @returns Extra photos only.
 * @calledBy GalleryUploadForm
 */
export function extraGalleryImages<T extends GalleryOrderImage>(
  images: T[],
): T[] {
  return images
    .filter((image) => image.displayOrder >= LISTING_EXTRA_PHOTO_START)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * nextExtraDisplayOrder
 *
 * Picks the next free extra slot between 8 and the gallery cap.
 *
 * @param images - Gallery images for a listing.
 * @returns Extra displayOrder, or null when extras are full.
 * @calledBy GalleryUploadForm, uploadListingGalleryAction
 */
export function nextExtraDisplayOrder(
  images: GalleryOrderImage[],
): number | null {
  const used = new Set(images.map((image) => image.displayOrder));
  for (
    let order = LISTING_EXTRA_PHOTO_START;
    order < MAX_LISTING_GALLERY_PHOTOS;
    order += 1
  ) {
    if (!used.has(order)) {
      return order;
    }
  }
  return null;
}

/**
 * isValidGalleryDisplayOrder
 *
 * Validates a client-supplied slot index before write.
 *
 * @param displayOrder - Proposed ListingImage.displayOrder.
 * @returns True for 0..MAX_LISTING_GALLERY_PHOTOS-1.
 * @calledBy uploadListingGalleryAction
 */
export function isValidGalleryDisplayOrder(displayOrder: number): boolean {
  return (
    Number.isInteger(displayOrder) &&
    displayOrder >= 0 &&
    displayOrder < MAX_LISTING_GALLERY_PHOTOS
  );
}

/** @deprecated Prefer LISTING_PHOTO_SLOTS; kept for any lingering copy references. */
export const LISTING_PHOTO_SHOT_LIST = LISTING_PHOTO_SLOTS.map(
  (slot) => slot.title,
);

/**
 * fieldErrorsFromZod
 *
 * Flattens Zod issues into a field-name → messages map for form UI.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
export function fieldErrorsFromZod(
  error: import("zod").ZodError,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    fieldErrors[key] ??= [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

/**
 * listingStepPath
 *
 * Supports listings by implementing listingStepPath.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
export function listingStepPath(listingId: string, step: number) {
  const suffix = LISTING_STEPS[step - 1]?.pathSuffix ?? "dispositivo";
  return `/vender/${listingId}/${suffix}`;
}
