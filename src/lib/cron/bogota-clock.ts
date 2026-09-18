/**
 * @file bogota-clock.ts
 * @description America/Bogota local clock helpers for cron scheduling.
 */

export const BOGOTA_TIME_ZONE = "America/Bogota";

/** Bogotá-local hour/minute slots used by the hourly cron tick. */
export const CRON_BOGOTA_SLOTS = {
  sellerListingCheckins: 14,
  buyerConfirmExpiry: 16,
  settlementReminders: 17,
} as const;

/**
 * getBogotaClock
 *
 * Returns the current hour (0–23) and minute in America/Bogota.
 *
 * @param now - Reference instant (injectable for tests).
 */
export function getBogotaClock(now: Date): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BOGOTA_TIME_ZONE,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  return { hour, minute };
}

/**
 * isBogotaHourSlot
 *
 * True when Bogotá local time is the given hour at minute 0 (hourly tick fires at :00).
 *
 * @param now - Reference instant.
 * @param hour - Target hour in Bogotá (0–23).
 */
export function isBogotaHourSlot(now: Date, hour: number): boolean {
  const clock = getBogotaClock(now);
  return clock.hour === hour && clock.minute === 0;
}
