import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { syncBuybackPrices } from "@/lib/buyback/price-sync";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!authorizeCronRequest(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (process.env.BUYBACK_ENABLED !== "true")
    return NextResponse.json({ skipped: true });
  try {
    return NextResponse.json(await syncBuybackPrices());
  } catch {
    console.error("buyback_price_sync_failed");
    return NextResponse.json(
      { error: "Import failed; previous prices retained" },
      { status: 503 },
    );
  }
}
