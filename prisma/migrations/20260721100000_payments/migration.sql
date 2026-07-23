-- Phase 10: Payments (Wompi / mock) + clearer order payment statuses

-- Drop status-predicate indexes before changing the enum (avoids text = OrderStatus errors)
DROP INDEX IF EXISTS "orders_listingId_pending_key";
DROP INDEX IF EXISTS "orders_listingId_active_key";

ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "orders"
  ALTER COLUMN "status" TYPE TEXT
  USING ("status"::text);

DROP TYPE IF EXISTS "OrderStatus";
DROP TYPE IF EXISTS "OrderStatus_new";

CREATE TYPE "OrderStatus" AS ENUM ('AWAITING_PAYMENT', 'PAID', 'CANCELLED', 'COMPLETED');

UPDATE "orders"
SET "status" = 'AWAITING_PAYMENT'
WHERE "status" = 'PENDING';

ALTER TABLE "orders"
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING ("status"::"OrderStatus");

ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'AWAITING_PAYMENT'::"OrderStatus";

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "orders_listingId_active_key"
  ON "orders"("listingId")
  WHERE "status" IN ('AWAITING_PAYMENT', 'PAID');

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM (
    'PENDING',
    'REQUIRES_ACTION',
    'SUCCEEDED',
    'FAILED',
    'REFUNDED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentProvider" AS ENUM ('WOMPI', 'MOCK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "equipmentPrice" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "providerCheckoutId" TEXT,
    "checkoutUrl" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payments_reference_key" ON "payments"("reference");
CREATE INDEX IF NOT EXISTS "payments_orderId_createdAt_idx" ON "payments"("orderId", "createdAt");
CREATE INDEX IF NOT EXISTS "payments_buyerId_createdAt_idx" ON "payments"("buyerId", "createdAt");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "payments_providerCheckoutId_idx" ON "payments"("providerCheckoutId");
CREATE INDEX IF NOT EXISTS "payments_providerPaymentId_idx" ON "payments"("providerPaymentId");

DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_buyerId_fkey"
    FOREIGN KEY ("buyerId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "eventType" TEXT NOT NULL,
    "externalEventKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "paymentId" TEXT,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payment_webhook_events_provider_externalEventKey_key"
  ON "payment_webhook_events"("provider", "externalEventKey");
CREATE INDEX IF NOT EXISTS "payment_webhook_events_paymentId_idx" ON "payment_webhook_events"("paymentId");

DO $$ BEGIN
  ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
