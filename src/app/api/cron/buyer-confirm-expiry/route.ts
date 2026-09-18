/**
 * @file route.ts
 * @description Secured cron endpoint that auto-releases expired buyer confirm
 * windows via Financial Core `processExpiredBuyerConfirmations`.
 * @dependencies next/server, @/lib/cron
 */

import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/lib/cron/auth";
import { runBuyerConfirmExpiryJob } from "@/lib/cron/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/buyer-confirm-expiry
 *
 * Manual dry-run for the 24h buyer-confirm auto-release job. Vercel Cron
 * invokes `/api/cron/tick` instead (Bogotá 16:00 slot).
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runBuyerConfirmExpiryJob(50);

  return NextResponse.json({
    ok: true,
    ...summary,
  });
}
