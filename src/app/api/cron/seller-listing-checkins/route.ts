/**
 * @file route.ts
 * @description Cron: seller listing check-ins day 7 / 14 (F2).
 */

import { NextResponse } from "next/server";

import { processSellerListingCheckins } from "@/lib/notifications/seller-listing-checkins";

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
  const results = await processSellerListingCheckins({
    limit: 200,
    siteOrigin,
  });

  return NextResponse.json({
    ok: true,
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    results,
  });
}
