-- @file 20260715060000_device_possession.sql
-- @description Adds device_possession_challenges for seller photo proof of physical device possession.
-- @dependencies PostgreSQL 15+, Supabase

-- CreateTable
CREATE TABLE "device_possession_challenges" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "photoUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_possession_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_possession_challenges_listingId_key" ON "device_possession_challenges"("listingId");

-- AddForeignKey
ALTER TABLE "device_possession_challenges" ADD CONSTRAINT "device_possession_challenges_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
