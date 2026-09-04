-- @file 20260904020000_listing_views_phase_15/migration.sql
-- @description Phase 15 listing view events and denormalized views index.
-- @dependencies PostgreSQL 15+, listings, profiles

-- Reset the legacy per-request counter so ops totals match unique-visitor-days.
UPDATE "listings" SET "views" = 0;

CREATE TABLE "listing_view_events" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "viewerId" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "viewedOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_view_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "listing_view_events_listingId_dedupeKey_viewedOn_key" ON "listing_view_events"("listingId", "dedupeKey", "viewedOn");

CREATE INDEX "listing_view_events_listingId_createdAt_idx" ON "listing_view_events"("listingId", "createdAt");

CREATE INDEX "listing_view_events_createdAt_idx" ON "listing_view_events"("createdAt");

CREATE INDEX "listing_view_events_viewerId_idx" ON "listing_view_events"("viewerId");

CREATE INDEX "listings_views_idx" ON "listings"("views");

ALTER TABLE "listing_view_events" ADD CONSTRAINT "listing_view_events_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "listing_view_events" ADD CONSTRAINT "listing_view_events_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
