/**
 * @file route.ts
 * @description Secured cron endpoint that auto-releases expired buyer confirm
 * windows via Financial Core `processExpiredBuyerConfirmations`.
 * @dependencies next/server, @/lib/financial-core
 */

import { NextResponse } from "next/server";

import { processExpiredBuyerConfirmations } from "@/lib/financial-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * authorizeCronRequest
 *
 * Validates `Authorization: Bearer ${CRON_SECRET}` for Vercel Cron (and manual ops).
 *
 * @param request - Incoming cron HTTP request.
 * @returns True when the secret matches a configured CRON_SECRET.
 * @calledBy GET /api/cron/buyer-confirm-expiry
 */
function authorizeCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/cron/buyer-confirm-expiry
 *
 * Runs the 24h buyer-confirm auto-release job. Vercel Cron calls this on a
 * schedule with `CRON_SECRET`. Manual ops may call the same route with the
 * Bearer token.
 *
 * @param request - Cron request (Authorization Bearer required).
 * @returns JSON summary of processed order ids and outcomes.
 * @calledBy Vercel Cron (`vercel.json`), ops tooling
 * @consumers Financial Core settlement → payout authorize path
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await processExpiredBuyerConfirmations(50);
  const succeeded = results.filter((row) => row.ok).length;
  const failed = results.filter((row) => !row.ok).length;

  return NextResponse.json({
    ok: true,
    processed: results.length,
    succeeded,
    failed,
    results,
  });
}
