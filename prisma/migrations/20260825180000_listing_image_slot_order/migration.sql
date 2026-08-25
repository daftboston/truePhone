-- @file 20260825180000_listing_image_slot_order/migration.sql
-- @description Unique (listingId, imageType, displayOrder) so each guided photo
--   slot maps to at most one gallery image. Gaps are allowed after deletes.
-- @dependencies PostgreSQL 15+, listing_images

-- Keep the newest row when a listing already has two images at the same order.
DELETE FROM "listing_images" AS older
USING "listing_images" AS newer
WHERE older."listingId" = newer."listingId"
  AND older."imageType" = newer."imageType"
  AND older."displayOrder" = newer."displayOrder"
  AND older.id <> newer.id
  AND (
    older."createdAt" < newer."createdAt"
    OR (older."createdAt" = newer."createdAt" AND older.id < newer.id)
  );

CREATE UNIQUE INDEX "listing_images_listingId_imageType_displayOrder_key"
ON "listing_images"("listingId", "imageType", "displayOrder");
