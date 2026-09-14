-- @file 20260826180000_order_support_workflow/migration.sql
-- @description Adds the auditable order-support workflow, cancellation shipment state, and support notifications.
-- @dependencies PostgreSQL 15+, orders, profiles, shipments, notifications

-- AlterEnum
ALTER TYPE "ShipmentStatus" ADD VALUE 'CANCELLED';

ALTER TYPE "NotificationType" ADD VALUE 'ORDER_SUPPORT_REPLY';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_SUPPORT_STATUS';
ALTER TYPE "NotificationType" ADD VALUE 'SELLER_CANCELLATION_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'BUYER_REMEDY_AVAILABLE';
ALTER TYPE "NotificationType" ADD VALUE 'REFUND_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'FULFILLMENT_ESCALATED';

-- CreateEnum
CREATE TYPE "OrderSupportCaseType" AS ENUM (
    'SELLER_CANCELLATION',
    'FULFILLMENT_EXCEPTION',
    'GENERAL_SUPPORT'
);

-- CreateEnum
CREATE TYPE "OrderSupportCaseStatus" AS ENUM (
    'PENDING',
    'IN_REVIEW',
    'NEEDS_SELLER_RESPONSE',
    'ESCALATED',
    'APPROVED',
    'REJECTED',
    'RESOLVED',
    'WITHDRAWN'
);

-- CreateTable
CREATE TABLE "order_support_cases" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "type" "OrderSupportCaseType" NOT NULL,
    "status" "OrderSupportCaseStatus" NOT NULL DEFAULT 'PENDING',
    "initialReason" TEXT NOT NULL,
    "assignedStaffId" TEXT,
    "decisionNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_support_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_support_messages" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_support_cases_status_createdAt_idx"
ON "order_support_cases"("status", "createdAt");

CREATE INDEX "order_support_cases_type_status_createdAt_idx"
ON "order_support_cases"("type", "status", "createdAt");

CREATE INDEX "order_support_cases_orderId_status_idx"
ON "order_support_cases"("orderId", "status");

CREATE INDEX "order_support_cases_assignedStaffId_status_idx"
ON "order_support_cases"("assignedStaffId", "status");

-- A seller may retain resolved history but cannot race two active cancellation requests.
CREATE UNIQUE INDEX "order_support_cases_active_cancellation_order_key"
ON "order_support_cases"("orderId")
WHERE "type" = 'SELLER_CANCELLATION'
  AND "status" IN ('PENDING', 'IN_REVIEW', 'NEEDS_SELLER_RESPONSE', 'ESCALATED');

CREATE INDEX "order_support_messages_caseId_createdAt_idx"
ON "order_support_messages"("caseId", "createdAt");

CREATE INDEX "order_support_messages_senderId_createdAt_idx"
ON "order_support_messages"("senderId", "createdAt");

-- AddForeignKey
ALTER TABLE "order_support_cases"
ADD CONSTRAINT "order_support_cases_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_support_cases"
ADD CONSTRAINT "order_support_cases_sellerId_fkey"
FOREIGN KEY ("sellerId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_support_cases"
ADD CONSTRAINT "order_support_cases_assignedStaffId_fkey"
FOREIGN KEY ("assignedStaffId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_support_messages"
ADD CONSTRAINT "order_support_messages_caseId_fkey"
FOREIGN KEY ("caseId") REFERENCES "order_support_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_support_messages"
ADD CONSTRAINT "order_support_messages_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
