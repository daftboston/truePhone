/**
 * @file route.ts
 * @description Hourly Vercel cron dispatcher (`0 * * * *`). Runs availability-hold expiry
 *   every tick; Bogotá-time slots for check-ins, buyer confirm, and settlement reminders.
 * @dependencies next/server, @/lib/cron
 */

import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/lib/cron/auth";
import { runCronTick } from "@/lib/cron/tick";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/tick
 *
 * Single Vercel cron entry (Hobby ≤2). Manual ops may call with CRON_SECRET Bearer.
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runCronTick();
  return NextResponse.json(result);
}
