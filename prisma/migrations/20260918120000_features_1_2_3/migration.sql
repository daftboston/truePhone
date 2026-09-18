-- Features 1–3: availability hold (F3), listing publish/boost (F2), ops indexes (F1)

-- CreateEnum
CREATE TYPE "AvailabilityHoldStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DENIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AvailabilityHoldEventKind" AS ENUM ('WARNING_ACK', 'CREATED', 'CONFIRMED', 'DENIED', 'EXPIRED', 'LATE_CONFIRM', 'PAYMENT_ATTEMPT');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'AVAILABILITY_HOLD_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'AVAILABILITY_HOLD_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'AVAILABILITY_HOLD_DENIED';
ALTER TYPE "NotificationType" ADD VALUE 'AVAILABILITY_HOLD_EXPIRED';
ALTER TYPE "NotificationType" ADD VALUE 'ALSO_LISTED_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'LISTING_CHECKIN_DAY7';
ALTER TYPE "NotificationType" ADD VALUE 'LISTING_CHECKIN_DAY14';

-- AlterTable
ALTER TABLE "listings" ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "priceAtPublish" INTEGER,
ADD COLUMN "boostUntil" TIMESTAMP(3),
ADD COLUMN "alsoListedElsewhere" BOOLEAN NOT NULL DEFAULT false;

-- Backfill publishedAt from approvedAt for existing published listings
UPDATE "listings"
SET "publishedAt" = COALESCE("approvedAt", "createdAt"),
    "priceAtPublish" = "price"
WHERE "status" IN ('PUBLISHED', 'RESERVED', 'SOLD', 'ARCHIVED')
  AND "publishedAt" IS NULL;

-- CreateTable
CREATE TABLE "availability_holds" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "status" "AvailabilityHoldStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "unlock_expires_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "denied_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_hold_events" (
    "id" TEXT NOT NULL,
    "hold_id" TEXT NOT NULL,
    "kind" "AvailabilityHoldEventKind" NOT NULL,
    "actor_id" TEXT,
    "payment_attempt_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_hold_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "availability_holds_order_id_key" ON "availability_holds"("order_id");

-- CreateIndex
CREATE INDEX "availability_holds_listing_id_status_idx" ON "availability_holds"("listing_id", "status");

-- CreateIndex
CREATE INDEX "availability_holds_buyer_id_status_idx" ON "availability_holds"("buyer_id", "status");

-- CreateIndex
CREATE INDEX "availability_holds_expires_at_idx" ON "availability_holds"("expires_at");

-- CreateIndex
CREATE INDEX "availability_hold_events_hold_id_created_at_idx" ON "availability_hold_events"("hold_id", "created_at");

-- CreateIndex
CREATE INDEX "listings_publishedAt_idx" ON "listings"("publishedAt");

-- CreateIndex
CREATE INDEX "listings_boostUntil_idx" ON "listings"("boostUntil");

-- CreateIndex
CREATE INDEX "orders_status_updatedAt_idx" ON "orders"("status", "updatedAt");

-- Partial unique: one PENDING hold per listing
CREATE UNIQUE INDEX "availability_holds_one_pending_per_listing"
ON "availability_holds" ("listing_id")
WHERE "status" = 'PENDING';

-- Partial unique: one PENDING hold per buyer
CREATE UNIQUE INDEX "availability_holds_one_pending_per_buyer"
ON "availability_holds" ("buyer_id")
WHERE "status" = 'PENDING';

-- AddForeignKey
ALTER TABLE "availability_holds" ADD CONSTRAINT "availability_holds_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_holds" ADD CONSTRAINT "availability_holds_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_holds" ADD CONSTRAINT "availability_holds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_hold_events" ADD CONSTRAINT "availability_hold_events_hold_id_fkey" FOREIGN KEY ("hold_id") REFERENCES "availability_holds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
