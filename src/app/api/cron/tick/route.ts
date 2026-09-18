/**
 * @file route.ts
 * @description Daily Vercel cron dispatcher (`0 14 * * *`). Runs hold expiry backstop
 *   plus seller check-ins, buyer-confirm, and settlement reminders in one batch.
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
 * Single daily Vercel cron entry (Hobby ≤2, once per day). Manual ops may call
 * with CRON_SECRET Bearer.
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runCronTick();
  return NextResponse.json(result);
}
