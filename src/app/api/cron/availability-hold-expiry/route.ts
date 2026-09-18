/**
 * @file route.ts
 * @description Cron: expire stale availability holds (F3).
 */

import { NextResponse } from "next/server";

import { expireStaleAvailabilityHolds } from "@/lib/availability-hold";
import { notifyBuyerAvailabilityHoldExpired } from "@/lib/notifications/availability-hold";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorizeCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const results = await expireStaleAvailabilityHolds(50);
  let notified = 0;

  for (const row of results.filter((r) => r.ok)) {
    try {
      await notifyBuyerAvailabilityHoldExpired({
        holdId: row.holdId,
        siteOrigin,
      });
      notified += 1;
    } catch {
      // dedupe or email noop — continue
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    notified,
    results,
  });
}
