/**
 * @file iphone-catalog-images.ts
 * @description Front/back product-shot paths for Explorar model cards.
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
