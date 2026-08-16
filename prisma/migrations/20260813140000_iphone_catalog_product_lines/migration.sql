-- @file 20260813140000_iphone_catalog_product_lines.sql
-- @description Adds product-line / generation / variant fields and per-model storage joins.
-- @dependencies PostgreSQL 15+, iphone_models, iphone_storages

CREATE TYPE "IphoneProductLine" AS ENUM ('IPHONE', 'IPHONE_SE', 'IPHONE_AIR');

CREATE TYPE "IphoneVariantType" AS ENUM ('STANDARD', 'MINI', 'PLUS', 'PRO', 'PRO_MAX', 'E', 'AIR');

ALTER TABLE "iphone_models"
ADD COLUMN "productLine" "IphoneProductLine" NOT NULL DEFAULT 'IPHONE',
ADD COLUMN "generation" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "variantType" "IphoneVariantType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing seed rows so NOT NULL columns are accurate before app seed runs.
UPDATE "iphone_models" SET "productLine" = 'IPHONE_SE', "generation" = 3, "variantType" = 'STANDARD', "sortOrder" = 10 WHERE "slug" = 'iphone-se-3';
UPDATE "iphone_models" SET "generation" = 12, "variantType" = 'STANDARD', "sortOrder" = 3 WHERE "slug" = 'iphone-12';
UPDATE "iphone_models" SET "generation" = 13, "variantType" = 'STANDARD', "sortOrder" = 7 WHERE "slug" = 'iphone-13';
UPDATE "iphone_models" SET "generation" = 13, "variantType" = 'PRO', "sortOrder" = 8 WHERE "slug" = 'iphone-13-pro';
UPDATE "iphone_models" SET "generation" = 14, "variantType" = 'STANDARD', "sortOrder" = 11 WHERE "slug" = 'iphone-14';
UPDATE "iphone_models" SET "generation" = 14, "variantType" = 'PRO', "sortOrder" = 13 WHERE "slug" = 'iphone-14-pro';
UPDATE "iphone_models" SET "generation" = 14, "variantType" = 'PRO_MAX', "sortOrder" = 14 WHERE "slug" = 'iphone-14-pro-max';
UPDATE "iphone_models" SET "generation" = 15, "variantType" = 'STANDARD', "sortOrder" = 15 WHERE "slug" = 'iphone-15';
UPDATE "iphone_models" SET "generation" = 15, "variantType" = 'PRO', "sortOrder" = 17 WHERE "slug" = 'iphone-15-pro';
UPDATE "iphone_models" SET "generation" = 15, "variantType" = 'PRO_MAX', "sortOrder" = 18 WHERE "slug" = 'iphone-15-pro-max';
UPDATE "iphone_models" SET "generation" = 16, "variantType" = 'STANDARD', "sortOrder" = 19 WHERE "slug" = 'iphone-16';
UPDATE "iphone_models" SET "generation" = 16, "variantType" = 'PRO', "sortOrder" = 21 WHERE "slug" = 'iphone-16-pro';
UPDATE "iphone_models" SET "generation" = 16, "variantType" = 'PRO_MAX', "sortOrder" = 22 WHERE "slug" = 'iphone-16-pro-max';

ALTER TABLE "iphone_models" ALTER COLUMN "productLine" DROP DEFAULT;
ALTER TABLE "iphone_models" ALTER COLUMN "generation" DROP DEFAULT;
ALTER TABLE "iphone_models" ALTER COLUMN "variantType" DROP DEFAULT;
ALTER TABLE "iphone_models" ALTER COLUMN "sortOrder" DROP DEFAULT;

CREATE UNIQUE INDEX "iphone_models_productLine_generation_variantType_key" ON "iphone_models"("productLine", "generation", "variantType");

CREATE INDEX "iphone_models_productLine_generation_idx" ON "iphone_models"("productLine", "generation");

CREATE INDEX "iphone_models_sortOrder_idx" ON "iphone_models"("sortOrder");

CREATE INDEX "iphone_models_releaseYear_idx" ON "iphone_models"("releaseYear");

CREATE TABLE "iphone_model_storages" (
    "id" TEXT NOT NULL,
    "iphoneModelId" TEXT NOT NULL,
    "iphoneStorageId" TEXT NOT NULL,

    CONSTRAINT "iphone_model_storages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "iphone_model_storages_iphoneModelId_idx" ON "iphone_model_storages"("iphoneModelId");

CREATE INDEX "iphone_model_storages_iphoneStorageId_idx" ON "iphone_model_storages"("iphoneStorageId");

CREATE UNIQUE INDEX "iphone_model_storages_iphoneModelId_iphoneStorageId_key" ON "iphone_model_storages"("iphoneModelId", "iphoneStorageId");

ALTER TABLE "iphone_model_storages" ADD CONSTRAINT "iphone_model_storages_iphoneModelId_fkey" FOREIGN KEY ("iphoneModelId") REFERENCES "iphone_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "iphone_model_storages" ADD CONSTRAINT "iphone_model_storages_iphoneStorageId_fkey" FOREIGN KEY ("iphoneStorageId") REFERENCES "iphone_storages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
