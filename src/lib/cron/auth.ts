/**
 * @file auth.ts
 * @description Shared CRON_SECRET bearer auth for Vercel Cron and manual ops.
 */

/**
 * authorizeCronRequest
 *
 * Validates `Authorization: Bearer ${CRON_SECRET}` for Vercel Cron (and manual ops).
 *
 * @param request - Incoming cron HTTP request.
 * @returns True when the secret matches a configured CRON_SECRET.
 */
export function authorizeCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}
