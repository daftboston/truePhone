-- @file 20260726010000_financial_core_phase_10b.sql
-- @description Phase 10b financial core: order fee snapshots, ledger_entries, payouts, bank accounts, fee_entitlements.
-- @dependencies PostgreSQL 15+, Supabase

-- Phase 10b: Financial Core (fee snapshots, ledger, payouts, entitlements)

CREATE TYPE "LedgerEntryType" AS ENUM (
  'PAYMENT_APPROVED',
  'HOLD_CREATED',
  'FEE_SNAPSHOT',
  'PAYOUT_AUTHORIZED',
  'PAYOUT_SUBMITTED',
  'PAYOUT_COMPLETED',
  'PAYOUT_FAILED',
  'REFUND_APPROVED',
  'REFUND_COMPLETED',
  'CHARGEBACK_RECEIVED',
  'DISPUTE_OPENED',
  'DISPUTE_RESOLVED',
  'BUYER_CONFIRMED',
  'BUYER_CONFIRM_EXPIRED',
  'SELLER_FULFILLMENT_ABANDONED',
  'PREMIUM_SHIPPING_FEE'
);

CREATE TYPE "PayoutStatus" AS ENUM (
  'PENDING',
  'AUTHORIZED',
  'SUBMITTED',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "PayoutProvider" AS ENUM ('WOMPI', 'MOCK');

CREATE TYPE "FeeEntitlementStatus" AS ENUM (
  'ACTIVE',
  'USED',
  'REFUNDED',
  'EXPIRED'
);

CREATE TYPE "BankAccountType" AS ENUM ('AHORROS', 'CORRIENTE');

ALTER TABLE "orders"
  ADD COLUMN "feeRateBps" INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN "wompiCollectionPesos" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "wompiPayoutPesos" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "truephoneRevenuePesos" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "sellerAmountPesos" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "premiumShippingFeePesos" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "sellerFeePesos" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "fundsHeldAt" TIMESTAMP(3),
  ADD COLUMN "payoutAuthorizedAt" TIMESTAMP(3),
  ADD COLUMN "payoutCompletedAt" TIMESTAMP(3),
  ADD COLUMN "buyerConfirmedAt" TIMESTAMP(3),
  ADD COLUMN "buyerConfirmDeadlineAt" TIMESTAMP(3),
  ADD COLUMN "payoutFrozen" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sellerFulfillmentAbandonedAt" TIMESTAMP(3);

-- Backfill seller amount + projected costs for existing orders (10% model).
UPDATE "orders"
SET
  "sellerAmountPesos" = "equipmentPrice",
  "feeRateBps" = CASE
    WHEN "equipmentPrice" > 0 AND "platformFee" * 1000 / "equipmentPrice" BETWEEN 750 AND 850 THEN 800
    WHEN "equipmentPrice" > 0 AND "platformFee" * 1000 / "equipmentPrice" BETWEEN 550 AND 650 THEN 600
    ELSE 1000
  END,
  "wompiCollectionPesos" = ROUND(("totalPrice"::numeric * 0.0275) * 1.19),
  "wompiPayoutPesos" = ROUND(("equipmentPrice"::numeric * 0.0045) * 1.19),
  "truephoneRevenuePesos" = GREATEST(
    0,
    "platformFee"
      - ROUND(("totalPrice"::numeric * 0.0275) * 1.19)::int
      - ROUND(("equipmentPrice"::numeric * 0.0045) * 1.19)::int
  ),
  "fundsHeldAt" = CASE WHEN "status" IN ('PAID', 'COMPLETED') THEN COALESCE("paidAt", "createdAt") ELSE NULL END,
  "payoutCompletedAt" = CASE WHEN "status" = 'COMPLETED' THEN "completedAt" ELSE NULL END;

CREATE INDEX "orders_buyerConfirmDeadlineAt_idx" ON "orders"("buyerConfirmDeadlineAt");

CREATE TABLE "ledger_entries" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "paymentId" TEXT,
  "payoutId" TEXT,
  "type" "LedgerEntryType" NOT NULL,
  "amountPesos" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'COP',
  "memo" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ledger_entries_orderId_createdAt_idx" ON "ledger_entries"("orderId", "createdAt");
CREATE INDEX "ledger_entries_type_createdAt_idx" ON "ledger_entries"("type", "createdAt");
CREATE INDEX "ledger_entries_payoutId_idx" ON "ledger_entries"("payoutId");

CREATE TABLE "seller_bank_accounts" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "legalIdType" TEXT NOT NULL,
  "legalId" TEXT NOT NULL,
  "bankCode" TEXT NOT NULL,
  "bankName" TEXT,
  "accountType" "BankAccountType" NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "holderName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "seller_bank_accounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "seller_bank_accounts_profileId_idx" ON "seller_bank_accounts"("profileId");

CREATE TABLE "payouts" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "sellerBankAccountId" TEXT,
  "provider" "PayoutProvider" NOT NULL,
  "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
  "amountPesos" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'COP',
  "idempotencyKey" TEXT NOT NULL,
  "providerPayoutId" TEXT,
  "providerLoteId" TEXT,
  "failureCode" TEXT,
  "failureMessage" TEXT,
  "authorizedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payouts_idempotencyKey_key" ON "payouts"("idempotencyKey");
CREATE INDEX "payouts_orderId_createdAt_idx" ON "payouts"("orderId", "createdAt");
CREATE INDEX "payouts_sellerId_createdAt_idx" ON "payouts"("sellerId", "createdAt");
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

CREATE TABLE "fee_entitlements" (
  "id" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "sourceOrderId" TEXT NOT NULL,
  "status" "FeeEntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
  "feeRateBps" INTEGER NOT NULL DEFAULT 800,
  "usedAt" TIMESTAMP(3),
  "usedOnOrderId" TEXT,
  "refundChosenAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fee_entitlements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fee_entitlements_sourceOrderId_key" ON "fee_entitlements"("sourceOrderId");
CREATE UNIQUE INDEX "fee_entitlements_usedOnOrderId_key" ON "fee_entitlements"("usedOnOrderId");
CREATE INDEX "fee_entitlements_buyerId_status_idx" ON "fee_entitlements"("buyerId", "status");

ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_payoutId_fkey"
  FOREIGN KEY ("payoutId") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "seller_bank_accounts"
  ADD CONSTRAINT "seller_bank_accounts_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payouts"
  ADD CONSTRAINT "payouts_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payouts"
  ADD CONSTRAINT "payouts_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payouts"
  ADD CONSTRAINT "payouts_sellerBankAccountId_fkey"
  FOREIGN KEY ("sellerBankAccountId") REFERENCES "seller_bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fee_entitlements"
  ADD CONSTRAINT "fee_entitlements_buyerId_fkey"
  FOREIGN KEY ("buyerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fee_entitlements"
  ADD CONSTRAINT "fee_entitlements_sourceOrderId_fkey"
  FOREIGN KEY ("sourceOrderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fee_entitlements"
  ADD CONSTRAINT "fee_entitlements_usedOnOrderId_fkey"
  FOREIGN KEY ("usedOnOrderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
