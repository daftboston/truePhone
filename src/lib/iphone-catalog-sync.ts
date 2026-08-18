/**
 * @file iphone-catalog-sync.ts
 * @description Upserts the canonical 28-model iPhone catalog into Postgres.
 * @dependencies @prisma/client, iphone-catalog-data
 */

import {
  IphoneProductLine,
  IphoneVariantType,
  type PrismaClient,
} from "@prisma/client";

import {
  IPHONE_CATALOG_COLORS,
  IPHONE_CATALOG_MODELS,
  IPHONE_CATALOG_STORAGES_GB,
} from "./iphone-catalog-data";

/** Prisma client or transaction used to write catalog lookup rows. */
export type IphoneCatalogDb = Pick<
  PrismaClient,
  | "iphoneColor"
  | "iphoneStorage"
  | "iphoneModel"
  | "iphoneModelColor"
  | "iphoneModelStorage"
>;

/**
 * missingCatalogSlugs
 *
 * Returns canonical model slugs that are not present in a stored slug list.
 *
 * @param existingSlugs - Slugs already stored in `iphone_models`.
 * @returns Missing slugs in canonical catalog order.
 * @calledBy ensureIphoneCatalog, iphone-catalog.test.ts
 */
export function missingCatalogSlugs(existingSlugs: Iterable<string>): string[] {
  const have = new Set(existingSlugs);
  return IPHONE_CATALOG_MODELS.filter((model) => !have.has(model.slug)).map(
    (model) => model.slug,
  );
}

/**
 * syncIphoneCatalog
 *
 * Upserts colors, storages, the 28 models, and per-model color/storage joins.
 *
 * @param db - Prisma client or transaction.
 * @returns Counts of models and join rows written this run.
 * @calledBy prisma/seed.ts, ensureIphoneCatalog
 */
export async function syncIphoneCatalog(db: IphoneCatalogDb) {
  await Promise.all(
    IPHONE_CATALOG_COLORS.map((color) =>
      db.iphoneColor.upsert({
        where: { name: color.name },
        update: { hex: color.hex },
        create: color,
      }),
    ),
  );

  await Promise.all(
    IPHONE_CATALOG_STORAGES_GB.map((valueGb) =>
      db.iphoneStorage.upsert({
        where: { valueGb },
        update: {},
        create: { valueGb },
      }),
    ),
  );

  const [allColors, allStorages] = await Promise.all([
    db.iphoneColor.findMany(),
    db.iphoneStorage.findMany(),
  ]);
  const colorByName = new Map(allColors.map((color) => [color.name, color]));
  const storageByGb = new Map(
    allStorages.map((storage) => [storage.valueGb, storage]),
  );

  let colorLinks = 0;
  let storageLinks = 0;

  for (const model of IPHONE_CATALOG_MODELS) {
    const row = await db.iphoneModel.upsert({
      where: { slug: model.slug },
      update: {
        name: model.name,
        productLine: model.productLine as IphoneProductLine,
        generation: model.generation,
        variantType: model.variantType as IphoneVariantType,
        releaseYear: model.releaseYear,
        sortOrder: model.sortOrder,
      },
      create: {
        name: model.name,
        slug: model.slug,
        productLine: model.productLine as IphoneProductLine,
        generation: model.generation,
        variantType: model.variantType as IphoneVariantType,
        releaseYear: model.releaseYear,
        sortOrder: model.sortOrder,
      },
    });

    const allowedColorIds: string[] = [];
    for (const colorName of model.colorNames) {
      const color = colorByName.get(colorName);
      if (!color) continue;
      allowedColorIds.push(color.id);
      await db.iphoneModelColor.upsert({
        where: {
          iphoneModelId_iphoneColorId: {
            iphoneModelId: row.id,
            iphoneColorId: color.id,
          },
        },
        update: {},
        create: {
          iphoneModelId: row.id,
          iphoneColorId: color.id,
        },
      });
      colorLinks += 1;
    }

    if (allowedColorIds.length > 0) {
      await db.iphoneModelColor.deleteMany({
        where: {
          iphoneModelId: row.id,
          iphoneColorId: { notIn: allowedColorIds },
        },
      });
    }

    const allowedStorageIds: string[] = [];
    for (const valueGb of model.storageGb) {
      const storage = storageByGb.get(valueGb);
      if (!storage) continue;
      allowedStorageIds.push(storage.id);
      await db.iphoneModelStorage.upsert({
        where: {
          iphoneModelId_iphoneStorageId: {
            iphoneModelId: row.id,
            iphoneStorageId: storage.id,
          },
        },
        update: {},
        create: {
          iphoneModelId: row.id,
          iphoneStorageId: storage.id,
        },
      });
      storageLinks += 1;
    }

    if (allowedStorageIds.length > 0) {
      await db.iphoneModelStorage.deleteMany({
        where: {
          iphoneModelId: row.id,
          iphoneStorageId: { notIn: allowedStorageIds },
        },
      });
    }
  }

  return {
    models: IPHONE_CATALOG_MODELS.length,
    colors: IPHONE_CATALOG_COLORS.length,
    storages: IPHONE_CATALOG_STORAGES_GB.length,
    colorLinks,
    storageLinks,
  };
}

/** In-process lock so concurrent browse requests share one backfill. */
let ensureCatalogPromise: Promise<void> | null = null;

/**
 * ensureIphoneCatalog
 *
 * Backfills missing canonical models (17, Air, Plus, mini, Pro Max, …)
 * when `iphone_models` is incomplete. No-ops when all 28 slugs exist.
 *
 * @param db - Prisma client used by listings/browse.
 * @returns Resolves when the catalog is complete or already up to date.
 * @calledBy getCatalog, listIphoneModels
 */
export async function ensureIphoneCatalog(db: IphoneCatalogDb) {
  if (!ensureCatalogPromise) {
    ensureCatalogPromise = (async () => {
      const rows = await db.iphoneModel.findMany({ select: { slug: true } });
      const missing = missingCatalogSlugs(rows.map((row) => row.slug));
      if (missing.length === 0) return;
      await syncIphoneCatalog(db);
    })().catch((error: unknown) => {
      ensureCatalogPromise = null;
      throw error;
    });
  }

  await ensureCatalogPromise;
}
