-- @file 20260720120000_messaging_indexes_and_safety.sql
-- @description Phase 8 messaging: message indexes plus user_blocks and conversation_reports safety tables.
-- @dependencies PostgreSQL 15+, Supabase

-- Phase 8 messaging: indexes + block/report safety tables

CREATE TABLE "user_blocks" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversation_reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messages_receiverId_isRead_idx" ON "messages"("receiverId", "isRead");
CREATE INDEX "messages_listingId_createdAt_idx" ON "messages"("listingId", "createdAt");
CREATE INDEX "messages_senderId_listingId_idx" ON "messages"("senderId", "listingId");

CREATE UNIQUE INDEX "user_blocks_blockerId_blockedId_key" ON "user_blocks"("blockerId", "blockedId");
CREATE INDEX "user_blocks_blockedId_idx" ON "user_blocks"("blockedId");

CREATE INDEX "conversation_reports_listingId_idx" ON "conversation_reports"("listingId");
CREATE INDEX "conversation_reports_reporterId_idx" ON "conversation_reports"("reporterId");

ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversation_reports" ADD CONSTRAINT "conversation_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_reports" ADD CONSTRAINT "conversation_reports_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
