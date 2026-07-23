-- Phase 9: Orders (reserve listing; payment in Phase 10)

CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CANCELLED', 'COMPLETED');

CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "equipmentPrice" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "cancelReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "orders_buyerId_createdAt_idx" ON "orders"("buyerId", "createdAt");
CREATE INDEX "orders_sellerId_createdAt_idx" ON "orders"("sellerId", "createdAt");
CREATE INDEX "orders_listingId_idx" ON "orders"("listingId");
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- At most one active (PENDING) order per listing
CREATE UNIQUE INDEX "orders_listingId_pending_key" ON "orders"("listingId") WHERE "status" = 'PENDING';

ALTER TABLE "orders" ADD CONSTRAINT "orders_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "reviews_orderId_idx" ON "reviews"("orderId");

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
