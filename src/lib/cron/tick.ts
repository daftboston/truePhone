/**
 * @file tick.ts
 * @description Daily cron dispatcher (Hobby: once per day). Runs hold expiry backstop
 *   plus seller check-ins, buyer-confirm, and settlement reminders in one batch.
 *   Lazy expiry on user paths remains authoritative for the 2h hold window.
 */

import { getBogotaClock } from "@/lib/cron/bogota-clock";
import {
  runAvailabilityHoldExpiryJob,
  runBuyerConfirmExpiryJob,
  runSellerListingCheckinsJob,
  runSettlementRemindersJob,
} from "@/lib/cron/jobs";

export type CronTickRunPlan = {
  bogotaHour: number;
  bogotaMinute: number;
  ran: {
    availabilityHoldExpiry: boolean;
    sellerListingCheckins: boolean;
    buyerConfirmExpiry: boolean;
    settlementReminders: boolean;
  };
};

export type CronTickResult = CronTickRunPlan & {
  ok: true;
  availabilityHoldExpiry: Awaited<
    ReturnType<typeof runAvailabilityHoldExpiryJob>
  >;
  sellerListingCheckins: Awaited<
    ReturnType<typeof runSellerListingCheckinsJob>
  >;
  buyerConfirmExpiry: Awaited<ReturnType<typeof runBuyerConfirmExpiryJob>>;
  settlementReminders: Awaited<ReturnType<typeof runSettlementRemindersJob>>;
};

/**
 * planCronTickRuns
 *
 * Pure plan for the daily tick — every job runs on each invocation.
 */
export function planCronTickRuns(now: Date): CronTickRunPlan {
  const { hour: bogotaHour, minute: bogotaMinute } = getBogotaClock(now);

  return {
    bogotaHour,
    bogotaMinute,
    ran: {
      availabilityHoldExpiry: true,
      sellerListingCheckins: true,
      buyerConfirmExpiry: true,
      settlementReminders: true,
    },
  };
}

/**
 * runCronTick
 *
 * Daily Vercel cron entry point. Always runs all jobs (backstop sweep).
 * Hold gates use lazy expiry on read/confirm/buy/checkout as the source of truth.
 */
export async function runCronTick(now = new Date()): Promise<CronTickResult> {
  const plan = planCronTickRuns(now);

  const [
    availabilityHoldExpiry,
    sellerListingCheckins,
    buyerConfirmExpiry,
    settlementReminders,
  ] = await Promise.all([
    runAvailabilityHoldExpiryJob(),
    runSellerListingCheckinsJob(),
    runBuyerConfirmExpiryJob(),
    runSettlementRemindersJob(),
  ]);

  return {
    ok: true,
    ...plan,
    availabilityHoldExpiry,
    sellerListingCheckins,
    buyerConfirmExpiry,
    settlementReminders,
  };
}
