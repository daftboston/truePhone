-- All-listings feed: landing preference + published feed index

-- CreateEnum
CREATE TYPE "LandingPreference" AS ENUM ('HOME', 'ANUNCIOS');

-- AlterTable
ALTER TABLE "profiles"
ADD COLUMN "landing_preference" "LandingPreference" NOT NULL DEFAULT 'HOME';

-- CreateIndex
CREATE INDEX "listings_status_publishedAt_id_idx" ON "listings"("status", "publishedAt", "id");
