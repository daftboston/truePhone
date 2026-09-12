/**
 * @file iphone-catalog-images.ts
 * @description Front/back product-shot paths and real-size scale for Explorar model cards.
 * @dependencies node:fs, node:path
 */

import { existsSync } from "node:fs";
import path from "node:path";

export const CATALOG_IMAGE_DIR = "public/catalog";
export const CATALOG_IMAGE_EXTS = ["webp", "png", "jpg", "jpeg"] as const;
export type CatalogImageSide = "front" | "back";
export type CatalogModelImages = {
  front: string | null;
  back: string | null;
};

/**
 * Official body height in millimetres. Explorar shots use this so a 6.3" 17 Pro
 * reads smaller than a 6.9" Pro Max — same proportions as Apple's size lineup.
 * @see public/catalog/README.md
 */
export const CATALOG_PHONE_BODY_MM: Record<string, number> = {
  "iphone-se-2": 138.4,
  "iphone-12-mini": 131.5,
  "iphone-12": 146.7,
  "iphone-12-pro": 146.7,
  "iphone-12-pro-max": 160.8,
  "iphone-13-mini": 131.5,
  "iphone-13": 146.7,
  "iphone-13-pro": 146.7,
  "iphone-13-pro-max": 160.8,
  "iphone-se-3": 138.4,
  "iphone-14": 146.7,
  "iphone-14-plus": 160.8,
  "iphone-14-pro": 147.5,
  "iphone-14-pro-max": 160.7,
  "iphone-15": 147.6,
  "iphone-15-plus": 160.9,
  "iphone-15-pro": 146.6,
  "iphone-15-pro-max": 159.9,
  "iphone-16": 147.6,
  "iphone-16-plus": 160.9,
  "iphone-16-pro": 149.6,
  "iphone-16-pro-max": 163.0,
  "iphone-16e": 146.7,
  "iphone-17": 149.6,
  "iphone-air": 156.2,
  "iphone-17-pro": 150.0,
  "iphone-17-pro-max": 163.4,
  "iphone-17e": 146.7,
};

/** Pixel height of the largest phone (17 Pro Max) on the 1200×1600 catalog canvas. */
export const CATALOG_PHONE_MAX_PX = 1320;
export const CATALOG_PHONE_CANVAS = { width: 1200, height: 1600 } as const;

/**
 * catalogPhoneRenderHeight
 *
 * Scales a model to the Pro Max body so lineup cards keep real-life size.
 *
 * @param slug - IphoneModel slug.
 * @returns Phone pixel height on the catalog canvas.
 * @calledBy catalog image mount script and size tests
 *
 * @example
 * catalogPhoneRenderHeight("iphone-17-pro"); // ~1212, vs 1320 for Pro Max
 */
export function catalogPhoneRenderHeight(slug: string): number {
  const mm = CATALOG_PHONE_BODY_MM[slug];
  const maxMm = CATALOG_PHONE_BODY_MM["iphone-17-pro-max"];
  if (!mm || !maxMm) {
    return CATALOG_PHONE_MAX_PX;
  }
  return Math.round((CATALOG_PHONE_MAX_PX * mm) / maxMm);
}

/**
 * catalogImageFilename
 *
 * Builds the on-disk filename for a catalog product shot.
 *
 * @param slug - IphoneModel slug (e.g. `iphone-17-pro-max`).
 * @param side - `front` or `back`.
 * @param ext - File extension without a dot.
 * @returns Filename only, e.g. `iphone-17-pro-max-front.webp`.
 * @calledBy resolveCatalogModelImages, catalog image tests
 *
 * @example
 * catalogImageFilename("iphone-air", "back", "png");
 */
export function catalogImageFilename(
  slug: string,
  side: CatalogImageSide,
  ext: (typeof CATALOG_IMAGE_EXTS)[number] = "webp",
): string {
  return `${slug}-${side}.${ext}`;
}

/**
 * findCatalogImageSrc
 *
 * Returns the public URL for the first matching file in `public/catalog`.
 *
 * @param slug - IphoneModel slug.
 * @param side - `front` or `back`.
 * @returns `/catalog/{slug}-{side}.{ext}` or null when the file is missing.
 * @calledBy resolveCatalogModelImages
 */
function findCatalogImageSrc(
  slug: string,
  side: CatalogImageSide,
): string | null {
  const dir = path.join(process.cwd(), CATALOG_IMAGE_DIR);
  for (const ext of CATALOG_IMAGE_EXTS) {
    const filename = catalogImageFilename(slug, side, ext);
    if (existsSync(path.join(dir, filename))) {
      return `/catalog/${filename}`;
    }
  }
  return null;
}

/**
 * resolveCatalogModelImages
 *
 * Looks up optional front/back product shots for an Explorar card.
 *
 * @param slug - IphoneModel slug.
 * @returns Public URLs when files exist; nulls when the silhouette should show.
 * @calledBy ExploreSeriesSection
 */
export function resolveCatalogModelImages(slug: string): CatalogModelImages {
  return {
    front: findCatalogImageSrc(slug, "front"),
    back: findCatalogImageSrc(slug, "back"),
  };
}
