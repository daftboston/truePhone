-- CreateEnum
CREATE TYPE "OrderDeliveryAddressChangeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "orders"
ADD COLUMN "delivery_recipient_name" TEXT,
ADD COLUMN "delivery_phone" TEXT,
ADD COLUMN "delivery_city" TEXT,
ADD COLUMN "delivery_department" TEXT,
ADD COLUMN "delivery_address_line" TEXT,
ADD COLUMN "delivery_notes" TEXT,
ADD COLUMN "delivery_address_frozen_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "order_delivery_address_changes" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" "OrderDeliveryAddressChangeStatus" NOT NULL DEFAULT 'PENDING',
    "requested_by_id" TEXT NOT NULL,
    "responded_by_id" TEXT,
    "old_recipient_name" TEXT NOT NULL,
    "old_phone" TEXT NOT NULL,
    "old_city" TEXT NOT NULL,
    "old_department" TEXT NOT NULL,
    "old_address_line" TEXT NOT NULL,
    "old_notes" TEXT,
    "new_recipient_name" TEXT NOT NULL,
    "new_phone" TEXT NOT NULL,
    "new_city" TEXT NOT NULL,
    "new_department" TEXT NOT NULL,
    "new_address_line" TEXT NOT NULL,
    "new_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "order_delivery_address_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_delivery_address_changes_order_id_status_idx" ON "order_delivery_address_changes"("order_id", "status");

-- CreateIndex
CREATE INDEX "order_delivery_address_changes_order_id_created_at_idx" ON "order_delivery_address_changes"("order_id", "created_at");

-- AddForeignKey
ALTER TABLE "order_delivery_address_changes" ADD CONSTRAINT "order_delivery_address_changes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_delivery_address_changes" ADD CONSTRAINT "order_delivery_address_changes_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_delivery_address_changes" ADD CONSTRAINT "order_delivery_address_changes_responded_by_id_fkey" FOREIGN KEY ("responded_by_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
