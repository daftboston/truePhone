-- @file 20260720000000_iphone_model_colors.sql
-- @description Adds iphone_model_colors join table mapping allowed colors per iPhone model.
-- @dependencies PostgreSQL 15+, Supabase

-- CreateTable
CREATE TABLE "iphone_model_colors" (
    "id" TEXT NOT NULL,
    "iphoneModelId" TEXT NOT NULL,
    "iphoneColorId" TEXT NOT NULL,

    CONSTRAINT "iphone_model_colors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "iphone_model_colors_iphoneModelId_idx" ON "iphone_model_colors"("iphoneModelId");

-- CreateIndex
CREATE INDEX "iphone_model_colors_iphoneColorId_idx" ON "iphone_model_colors"("iphoneColorId");

-- CreateIndex
CREATE UNIQUE INDEX "iphone_model_colors_iphoneModelId_iphoneColorId_key" ON "iphone_model_colors"("iphoneModelId", "iphoneColorId");

-- AddForeignKey
ALTER TABLE "iphone_model_colors" ADD CONSTRAINT "iphone_model_colors_iphoneModelId_fkey" FOREIGN KEY ("iphoneModelId") REFERENCES "iphone_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iphone_model_colors" ADD CONSTRAINT "iphone_model_colors_iphoneColorId_fkey" FOREIGN KEY ("iphoneColorId") REFERENCES "iphone_colors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
