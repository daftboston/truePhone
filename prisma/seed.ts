/**
 * @file seed.ts
 * @description Seeds the 28-model iPhone catalog plus per-model colors and storages.
 * @dependencies dotenv, @prisma/adapter-pg, @prisma/client, iphone-catalog-data
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  IphoneProductLine,
  IphoneVariantType,
  PrismaClient,
} from "@prisma/client";

import {
  IPHONE_CATALOG_COLORS,
  IPHONE_CATALOG_MODELS,
  IPHONE_CATALOG_STORAGES_GB,
} from "../src/lib/iphone-catalog-data";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

/**
 * main
 *
 * Upserts catalog models, colors, storages, and allowed joins from the canonical data file.
 *
 * @returns Resolves when seed logging completes.
 */
async function main() {
  for (const color of IPHONE_CATALOG_COLORS) {
    await prisma.iphoneColor.upsert({
      where: { name: color.name },
      update: { hex: color.hex },
      create: color,
    });
  }

  for (const valueGb of IPHONE_CATALOG_STORAGES_GB) {
    await prisma.iphoneStorage.upsert({
      where: { valueGb },
      update: {},
      create: { valueGb },
    });
  }

  const allColors = await prisma.iphoneColor.findMany();
  const allStorages = await prisma.iphoneStorage.findMany();
  const colorByName = new Map(allColors.map((color) => [color.name, color]));
  const storageByGb = new Map(
    allStorages.map((storage) => [storage.valueGb, storage]),
  );

  let colorLinks = 0;
  let storageLinks = 0;

  for (const model of IPHONE_CATALOG_MODELS) {
    const row = await prisma.iphoneModel.upsert({
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
      await prisma.iphoneModelColor.upsert({
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
      await prisma.iphoneModelColor.deleteMany({
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
      await prisma.iphoneModelStorage.upsert({
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
      await prisma.iphoneModelStorage.deleteMany({
        where: {
          iphoneModelId: row.id,
          iphoneStorageId: { notIn: allowedStorageIds },
        },
      });
    }
  }

  console.log(
    `Seeded ${IPHONE_CATALOG_MODELS.length} models, ${IPHONE_CATALOG_COLORS.length} colors, ${IPHONE_CATALOG_STORAGES_GB.length} storages, ${colorLinks} model↔color links, ${storageLinks} model↔storage links.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
