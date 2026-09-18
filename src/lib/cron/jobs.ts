/**
 * @file jobs.ts
 * @description Thin cron job wrappers around existing processors (Financial Core, notifications, holds).
 */

import { runAvailabilityHoldExpiryBackstop } from "@/lib/availability-hold";
import { processExpiredBuyerConfirmations } from "@/lib/financial-core";
import { processSettlementReminders } from "@/lib/notifications";
import { processSellerListingCheckins } from "@/lib/notifications/seller-listing-checkins";

/**
 * cronSiteOrigin
 *
 * Resolves public site origin for notification links in cron jobs.
 */
export function cronSiteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * runBuyerConfirmExpiryJob
 *
 * Auto-releases expired buyer confirm windows (Financial Core 24h auto-release).
 */
export async function runBuyerConfirmExpiryJob(limit = 50) {
  const results = await processExpiredBuyerConfirmations(limit);
  const succeeded = results.filter((row) => row.ok).length;
  const failed = results.filter((row) => !row.ok).length;

  return {
    processed: results.length,
    succeeded,
    failed,
    results,
  };
}

/**
 * runSettlementRemindersJob
 *
 * Sends buyer «Ya recibí» confirm reminders within the pre-deadline window.
 */
export async function runSettlementRemindersJob(limit = 50) {
  const siteOrigin = cronSiteOrigin();
  const reminderResults = await processSettlementReminders({
    limit,
    siteOrigin,
  });
  const created = reminderResults.filter((row) => row.ok && row.created).length;
  const failed = reminderResults.filter((row) => !row.ok).length;

  return {
    processed: reminderResults.length,
    created,
    failed,
    results: reminderResults,
  };
}

/**
 * runAvailabilityHoldExpiryJob
 *
 * Expires stale availability holds and notifies buyers (daily backstop sweep).
 */
export async function runAvailabilityHoldExpiryJob(limit = 50) {
  const siteOrigin = cronSiteOrigin();
  const holdBackstop = await runAvailabilityHoldExpiryBackstop({
    limit,
    siteOrigin,
  });

  return {
    processed: holdBackstop.results.length,
    notified: holdBackstop.notified,
    results: holdBackstop.results,
  };
}

/**
 * runSellerListingCheckinsJob
 *
 * Day 7 / 14 seller listing check-in emails and in-app notifications (F2).
 */
export async function runSellerListingCheckinsJob(limit = 200) {
  const siteOrigin = cronSiteOrigin();
  const checkinResults = await processSellerListingCheckins({
    limit,
    siteOrigin,
  });

  return {
    processed: checkinResults.length,
    succeeded: checkinResults.filter((r) => r.ok).length,
    results: checkinResults,
  };
}
