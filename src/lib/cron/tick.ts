/**
 * @file tick.ts
 * @description Hourly cron dispatcher: always expires holds; Bogotá-time slots for other jobs.
 */

import {
  CRON_BOGOTA_SLOTS,
  getBogotaClock,
  isBogotaHourSlot,
} from "@/lib/cron/bogota-clock";
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
  availabilityHoldExpiry?: Awaited<
    ReturnType<typeof runAvailabilityHoldExpiryJob>
  >;
  sellerListingCheckins?: Awaited<
    ReturnType<typeof runSellerListingCheckinsJob>
  >;
  buyerConfirmExpiry?: Awaited<ReturnType<typeof runBuyerConfirmExpiryJob>>;
  settlementReminders?: Awaited<ReturnType<typeof runSettlementRemindersJob>>;
};

/**
 * planCronTickRuns
 *
 * Pure schedule plan for the hourly tick (no side effects).
 *
 * @param now - Reference instant (injectable for tests).
 */
export function planCronTickRuns(now: Date): CronTickRunPlan {
  const { hour: bogotaHour, minute: bogotaMinute } = getBogotaClock(now);

  return {
    bogotaHour,
    bogotaMinute,
    ran: {
      availabilityHoldExpiry: true,
      sellerListingCheckins: isBogotaHourSlot(
        now,
        CRON_BOGOTA_SLOTS.sellerListingCheckins,
      ),
      buyerConfirmExpiry: isBogotaHourSlot(
        now,
        CRON_BOGOTA_SLOTS.buyerConfirmExpiry,
      ),
      settlementReminders: isBogotaHourSlot(
        now,
        CRON_BOGOTA_SLOTS.settlementReminders,
      ),
    },
  };
}

/**
 * runCronTick
 *
 * Hourly Vercel cron entry point. Always runs availability-hold expiry; other jobs
 * fire at Bogotá-local slots (14:00 check-ins, 16:00 buyer confirm, 17:00 settlement
 * — nearest hourly tick after the 16:30 settlement target).
 *
 * @param now - Reference instant (injectable for tests).
 */
export async function runCronTick(now = new Date()): Promise<CronTickResult> {
  const { bogotaHour, bogotaMinute, ran } = planCronTickRuns(now);

  const availabilityHoldExpiry = await runAvailabilityHoldExpiryJob();

  const result: CronTickResult = {
    ok: true,
    bogotaHour,
    bogotaMinute,
    ran,
    availabilityHoldExpiry,
  };

  if (ran.sellerListingCheckins) {
    result.sellerListingCheckins = await runSellerListingCheckinsJob();
  }

  if (ran.buyerConfirmExpiry) {
    result.buyerConfirmExpiry = await runBuyerConfirmExpiryJob();
  }

  if (ran.settlementReminders) {
    result.settlementReminders = await runSettlementRemindersJob();
  }

  return result;
}
