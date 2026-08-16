-- @file 20260721220000_reviews_phase_11.sql
-- @description Phase 11 reviews: requires orderId, moderation hide fields, unique order/reviewer, review_reports.
-- @dependencies PostgreSQL 15+, Supabase

-- Phase 11: Order-tied reviews + moderation reports

-- Drop any orphan draft reviews without an order (none expected in V1).
DELETE FROM "reviews" WHERE "orderId" IS NULL;

ALTER TABLE "reviews" ALTER COLUMN "orderId" SET NOT NULL;

ALTER TABLE "reviews" ADD COLUMN "hiddenAt" TIMESTAMP(3);
ALTER TABLE "reviews" ADD COLUMN "hiddenById" TEXT;

CREATE UNIQUE INDEX "reviews_orderId_reviewerId_key" ON "reviews"("orderId", "reviewerId");

CREATE INDEX "reviews_reviewedUserId_createdAt_idx" ON "reviews"("reviewedUserId", "createdAt");

ALTER TABLE "reviews" DROP CONSTRAINT "reviews_orderId_fkey";
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "review_reports" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "review_reports_reviewId_idx" ON "review_reports"("reviewId");
CREATE INDEX "review_reports_reporterId_idx" ON "review_reports"("reporterId");
CREATE INDEX "review_reports_resolvedAt_idx" ON "review_reports"("resolvedAt");

ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
