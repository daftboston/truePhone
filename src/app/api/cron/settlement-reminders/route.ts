/**
 * @file route.ts
 * @description Daily cron: settlement reminders, availability-hold backstop, seller check-ins.
 *   Vercel Hobby allows at most two daily cron routes — extra jobs run here.
 * @dependencies next/server, @/lib/notifications, @/lib/availability-hold
 */

import { NextResponse } from "next/server";

import { runAvailabilityHoldExpiryBackstop } from "@/lib/availability-hold";
import { processSettlementReminders } from "@/lib/notifications";
import { processSellerListingCheckins } from "@/lib/notifications/seller-listing-checkins";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * authorizeCronRequest
 *
 * Validates `Authorization: Bearer ${CRON_SECRET}` for Vercel Cron (and manual ops).
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
 * Daily batch (~16:30 UTC): buyer confirm reminders, hold expiry backstop,
 * and seller listing check-ins (day 7 / 14).
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const [reminderResults, holdBackstop, checkinResults] = await Promise.all([
    processSettlementReminders({ limit: 50, siteOrigin }),
    runAvailabilityHoldExpiryBackstop({ limit: 50, siteOrigin }),
    processSellerListingCheckins({ limit: 200, siteOrigin }),
  ]);

  const created = reminderResults.filter((row) => row.ok && row.created).length;
  const reminderFailed = reminderResults.filter((row) => !row.ok).length;

  return NextResponse.json({
    ok: true,
    settlementReminders: {
      processed: reminderResults.length,
      created,
      failed: reminderFailed,
      results: reminderResults,
    },
    availabilityHoldBackstop: {
      processed: holdBackstop.results.length,
      notified: holdBackstop.notified,
      results: holdBackstop.results,
    },
    sellerListingCheckins: {
      processed: checkinResults.length,
      succeeded: checkinResults.filter((r) => r.ok).length,
      results: checkinResults,
    },
  });
}
