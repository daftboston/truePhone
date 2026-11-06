-- CreateEnum
CREATE TYPE "BuybackQuoteStatus" AS ENUM ('DRAFT', 'RANGE_READY', 'REVIEW_REQUESTED', 'OFFER_SENT', 'OFFER_ACCEPTED', 'PURCHASED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'BUYBACK_OFFER';

-- CreateTable
CREATE TABLE "buyback_price_imports" (
    "id" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "importedById" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validRows" INTEGER NOT NULL,
    "issues" JSONB NOT NULL,

    CONSTRAINT "buyback_price_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyback_prices" (
    "id" TEXT NOT NULL,
    "iphoneModelId" TEXT NOT NULL,
    "iphoneStorageId" TEXT NOT NULL,
    "purchasePriceCop" INTEGER NOT NULL,
    "sourceRow" INTEGER NOT NULL,
    "importId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyback_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyback_quotes" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "clientRequestId" TEXT NOT NULL,
    "iphoneModelId" TEXT NOT NULL,
    "iphoneStorageId" TEXT NOT NULL,
    "condition" "Condition" NOT NULL,
    "batteryHealth" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Bogotá',
    "status" "BuybackQuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "purchasePriceCop" INTEGER,
    "priceImportId" TEXT,
    "rangeMinCop" INTEGER,
    "rangeMaxCop" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "rangeInterestedAt" TIMESTAMP(3),
    "reviewDueAt" TIMESTAMP(3),
    "ownershipConfirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activationLockConfirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentOfferVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyback_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyback_photos" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "objectPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyback_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyback_offers" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "amountCop" INTEGER NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "conditions" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyback_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyback_events" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyback_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "buyback_price_imports_importedAt_idx" ON "buyback_price_imports"("importedAt");

-- CreateIndex
CREATE UNIQUE INDEX "buyback_prices_iphoneModelId_iphoneStorageId_key" ON "buyback_prices"("iphoneModelId", "iphoneStorageId");

-- CreateIndex
CREATE INDEX "buyback_quotes_sellerId_createdAt_idx" ON "buyback_quotes"("sellerId", "createdAt");

-- CreateIndex
CREATE INDEX "buyback_quotes_status_reviewDueAt_idx" ON "buyback_quotes"("status", "reviewDueAt");

-- CreateIndex
CREATE UNIQUE INDEX "buyback_quotes_sellerId_clientRequestId_key" ON "buyback_quotes"("sellerId", "clientRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "buyback_photos_objectPath_key" ON "buyback_photos"("objectPath");

-- CreateIndex
CREATE UNIQUE INDEX "buyback_photos_quoteId_slot_key" ON "buyback_photos"("quoteId", "slot");

-- CreateIndex
CREATE INDEX "buyback_offers_expiresAt_idx" ON "buyback_offers"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "buyback_offers_quoteId_version_key" ON "buyback_offers"("quoteId", "version");

-- CreateIndex
CREATE INDEX "buyback_events_quoteId_createdAt_idx" ON "buyback_events"("quoteId", "createdAt");

-- AddForeignKey
ALTER TABLE "buyback_price_imports" ADD CONSTRAINT "buyback_price_imports_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback_prices" ADD CONSTRAINT "buyback_prices_iphoneModelId_fkey" FOREIGN KEY ("iphoneModelId") REFERENCES "iphone_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback_prices" ADD CONSTRAINT "buyback_prices_iphoneStorageId_fkey" FOREIGN KEY ("iphoneStorageId") REFERENCES "iphone_storages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback_prices" ADD CONSTRAINT "buyback_prices_importId_fkey" FOREIGN KEY ("importId") REFERENCES "buyback_price_imports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback_quotes" ADD CONSTRAINT "buyback_quotes_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback_quotes" ADD CONSTRAINT "buyback_quotes_iphoneModelId_fkey" FOREIGN KEY ("iphoneModelId") REFERENCES "iphone_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback_quotes" ADD CONSTRAINT "buyback_quotes_iphoneStorageId_fkey" FOREIGN KEY ("iphoneStorageId") REFERENCES "iphone_storages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback_quotes" ADD CONSTRAINT "buyback_quotes_priceImportId_fkey" FOREIGN KEY ("priceImportId") REFERENCES "buyback_price_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback_photos" ADD CONSTRAINT "buyback_photos_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "buyback_quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback_offers" ADD CONSTRAINT "buyback_offers_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "buyback_quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback_offers" ADD CONSTRAINT "buyback_offers_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback_events" ADD CONSTRAINT "buyback_events_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "buyback_quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyback_events" ADD CONSTRAINT "buyback_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- All buyback tables contain internal pricing, identifiers or private evidence.
-- Prisma's trusted server connection is the ONLY data path; no data-API policies.
ALTER TABLE public.buyback_price_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyback_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyback_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyback_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyback_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyback_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.buyback_price_imports, public.buyback_prices, public.buyback_quotes,
  public.buyback_photos, public.buyback_offers, public.buyback_events FROM anon, authenticated;

ALTER TABLE public.buyback_prices ADD CONSTRAINT buyback_price_cop_check
  CHECK ("purchasePriceCop" > 100000 AND "purchasePriceCop" <= 2147433647);
ALTER TABLE public.buyback_quotes ADD CONSTRAINT buyback_quote_input_check
  CHECK (city = 'Bogotá' AND "batteryHealth" BETWEEN 0 AND 100 AND version > 0 AND "currentOfferVersion" >= 0);
ALTER TABLE public.buyback_quotes ADD CONSTRAINT buyback_quote_snapshot_check
  CHECK (("purchasePriceCop" IS NULL AND "priceImportId" IS NULL AND "rangeMinCop" IS NULL AND "rangeMaxCop" IS NULL)
    OR ("purchasePriceCop" IS NOT NULL AND "priceImportId" IS NOT NULL AND "rangeMinCop" IS NOT NULL AND "rangeMaxCop" IS NOT NULL
      AND "purchasePriceCop" > 100000 AND "purchasePriceCop" <= 2147433647
      AND "rangeMinCop" = "purchasePriceCop" - 100000 AND "rangeMaxCop" = "purchasePriceCop" + 50000));
ALTER TABLE public.buyback_photos ADD CONSTRAINT buyback_photo_slot_check CHECK (slot BETWEEN 0 AND 11);
ALTER TABLE public.buyback_offers ADD CONSTRAINT buyback_offer_input_check
  CHECK (version > 0 AND "amountCop" > 0 AND "amountCop" <= 2147433647
    AND "expiresAt" > "createdAt" AND ("acceptedAt" IS NULL OR "acceptedAt" < "expiresAt"));
CREATE UNIQUE INDEX buyback_one_current_offer ON public.buyback_offers ("quoteId") WHERE "supersededAt" IS NULL;
