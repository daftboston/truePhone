/**
 * @file route.ts
 * @description Secured cron endpoint for buyer «Ya recibí» confirm reminders.
 * @dependencies next/server, @/lib/cron
 */

import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/lib/cron/auth";
import { runSettlementRemindersJob } from "@/lib/cron/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/settlement-reminders
 *
 * Manual dry-run for settlement reminders. Vercel Cron invokes `/api/cron/tick`
 * (daily batch) instead.
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runSettlementRemindersJob(50);

  return NextResponse.json({
    ok: true,
    settlementReminders: summary,
  });
}
