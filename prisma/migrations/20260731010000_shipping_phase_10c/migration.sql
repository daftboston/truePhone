-- @file 20260731010000_shipping_phase_10c.sql
-- @description Phase 10c shipping: shipments and shipment_inspections for Carrier and Premium Bogotá methods.
-- @dependencies PostgreSQL 15+, Supabase

-- Phase 10c: Shipping (Carrier + Premium Bogotá)

CREATE TYPE "ShippingMethod" AS ENUM ('PREMIUM_BOGOTA', 'CARRIER');

CREATE TYPE "ShipmentStatus" AS ENUM (
  'METHOD_SELECTED',
  'AWAITING_PICKUP',
  'INSPECTION',
  'IN_TRANSIT',
  'DELIVERED',
  'FAILED',
  'RETURNED'
);

CREATE TYPE "InspectionResult" AS ENUM ('PENDING', 'PASSED', 'FAILED');

CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "ShippingMethod" NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'METHOD_SELECTED',
    "carrierName" TEXT,
    "trackingCode" TEXT,
    "evidenceUrl" TEXT,
    "premiumFeeCop" INTEGER NOT NULL DEFAULT 0,
    "methodSelectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trackingUploadedAt" TIMESTAMP(3),
    "pickupScheduledAt" TIMESTAMP(3),
    "inspectionAt" TIMESTAMP(3),
    "inTransitAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shipments_orderId_key" ON "shipments"("orderId");
CREATE INDEX "shipments_status_idx" ON "shipments"("status");
CREATE INDEX "shipments_method_idx" ON "shipments"("method");

ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "shipment_inspections" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "result" "InspectionResult" NOT NULL DEFAULT 'PENDING',
    "imeiMatch" BOOLEAN,
    "serialMatch" BOOLEAN,
    "storageMatch" BOOLEAN,
    "colorMatch" BOOLEAN,
    "cosmeticNotes" TEXT,
    "accessoriesOk" BOOLEAN,
    "batteryHealthPct" INTEGER,
    "notes" TEXT,
    "inspectedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_inspections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shipment_inspections_shipmentId_key" ON "shipment_inspections"("shipmentId");

ALTER TABLE "shipment_inspections" ADD CONSTRAINT "shipment_inspections_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
