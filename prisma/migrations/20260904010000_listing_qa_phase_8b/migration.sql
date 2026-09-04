-- @file 20260904010000_listing_qa_phase_8b/migration.sql
-- @description Phase 8b public listing Q&A tables and notification kinds.
-- @dependencies PostgreSQL 15+, listings, profiles, NotificationType

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LISTING_QUESTION_NEW';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LISTING_QUESTION_ANSWERED';

CREATE TABLE "listing_questions" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "askerId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "hiddenAt" TIMESTAMP(3),
    "hiddenById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "listing_question_answers" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "hiddenAt" TIMESTAMP(3),
    "hiddenById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_question_answers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "listing_question_reports" (
    "id" TEXT NOT NULL,
    "questionId" TEXT,
    "answerId" TEXT,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "listing_question_reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "listing_question_reports_target_chk" CHECK (
        ("questionId" IS NOT NULL AND "answerId" IS NULL)
        OR ("questionId" IS NULL AND "answerId" IS NOT NULL)
    )
);

CREATE INDEX "listing_questions_listingId_createdAt_idx" ON "listing_questions"("listingId", "createdAt");
CREATE INDEX "listing_questions_askerId_idx" ON "listing_questions"("askerId");

CREATE UNIQUE INDEX "listing_question_answers_questionId_key" ON "listing_question_answers"("questionId");
CREATE INDEX "listing_question_answers_sellerId_idx" ON "listing_question_answers"("sellerId");

CREATE INDEX "listing_question_reports_questionId_idx" ON "listing_question_reports"("questionId");
CREATE INDEX "listing_question_reports_answerId_idx" ON "listing_question_reports"("answerId");
CREATE INDEX "listing_question_reports_reporterId_idx" ON "listing_question_reports"("reporterId");
CREATE INDEX "listing_question_reports_resolvedAt_idx" ON "listing_question_reports"("resolvedAt");

ALTER TABLE "listing_questions" ADD CONSTRAINT "listing_questions_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_questions" ADD CONSTRAINT "listing_questions_askerId_fkey" FOREIGN KEY ("askerId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "listing_question_answers" ADD CONSTRAINT "listing_question_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "listing_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_question_answers" ADD CONSTRAINT "listing_question_answers_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "listing_question_reports" ADD CONSTRAINT "listing_question_reports_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "listing_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_question_reports" ADD CONSTRAINT "listing_question_reports_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "listing_question_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_question_reports" ADD CONSTRAINT "listing_question_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
