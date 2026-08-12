-- @file 20260811140000_recommended_prices_phase_13/migration.sql
-- @description Admin-maintained recommended price guide (model + storage + condition).
-- @dependencies PostgreSQL 15+, iphone_models, iphone_storages, Condition enum

-- CreateTable
CREATE TABLE "recommended_prices" (
    "id" TEXT NOT NULL,
    "iphoneModelId" TEXT NOT NULL,
    "iphoneStorageId" TEXT NOT NULL,
    "condition" "Condition" NOT NULL,
    "priceCop" INTEGER NOT NULL,
    "minPriceCop" INTEGER,
    "maxPriceCop" INTEGER,
    "notes" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommended_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recommended_prices_iphoneModelId_idx" ON "recommended_prices"("iphoneModelId");

-- CreateIndex
CREATE INDEX "recommended_prices_condition_idx" ON "recommended_prices"("condition");

-- CreateIndex
CREATE UNIQUE INDEX "recommended_prices_iphoneModelId_iphoneStorageId_condition_key" ON "recommended_prices"("iphoneModelId", "iphoneStorageId", "condition");

-- AddForeignKey
ALTER TABLE "recommended_prices" ADD CONSTRAINT "recommended_prices_iphoneModelId_fkey" FOREIGN KEY ("iphoneModelId") REFERENCES "iphone_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommended_prices" ADD CONSTRAINT "recommended_prices_iphoneStorageId_fkey" FOREIGN KEY ("iphoneStorageId") REFERENCES "iphone_storages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
