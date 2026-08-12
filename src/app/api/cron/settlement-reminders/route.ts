/**
 * @file route.ts
 * @description Cron: nudge buyers whose 24h confirm window is nearly over.
 * @dependencies next/server, @/lib/notifications
 */

import { NextResponse } from "next/server";

import { processSettlementReminders } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * authorizeCronRequest
 *
 * Validates `Authorization: Bearer ${CRON_SECRET}` for Vercel Cron (and manual ops).
 *
 * @param request - Incoming cron HTTP request.
 * @returns True when the secret matches a configured CRON_SECRET.
 * @calledBy GET /api/cron/settlement-reminders
 */
function authorizeCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/cron/settlement-reminders
 *
 * Sends in-app + email reminders for orders approaching buyer-confirm expiry.
 *
 * @param request - Cron request (Authorization Bearer required).
 * @returns JSON summary of processed reminder outcomes.
 * @calledBy Vercel Cron (`vercel.json`), ops tooling
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const results = await processSettlementReminders({
    limit: 50,
    siteOrigin,
  });
  const created = results.filter((row) => row.ok && row.created).length;
  const failed = results.filter((row) => !row.ok).length;

  return NextResponse.json({
    ok: true,
    processed: results.length,
    created,
    failed,
    results,
  });
}
