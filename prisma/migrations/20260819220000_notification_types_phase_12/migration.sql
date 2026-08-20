-- @file 20260819220000_notification_types_phase_12/migration.sql
-- @description Adds marketplace notification kinds beyond settlement reminders.
-- @dependencies PostgreSQL 15+, NotificationType enum

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LISTING_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LISTING_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'IDENTITY_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'IDENTITY_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ORDER_PAID';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEW_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SHIPPING_METHOD_CHOSEN';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TRACKING_UPLOADED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYOUT_SENT';
