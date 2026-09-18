/**
 * @file bogota-clock.ts
 * @description America/Bogota local clock helpers for cron logging.
 */

export const BOGOTA_TIME_ZONE = "America/Bogota";

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
