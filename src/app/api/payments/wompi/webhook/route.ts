import { NextResponse } from "next/server";

import { handleWompiWebhook } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * Wompi event URL — register in the commerce dashboard (sandbox + production).
 * POST /api/payments/wompi/webhook
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const checksumHeader = request.headers.get("X-Event-Checksum");
  const result = await handleWompiWebhook({
    body: body as Parameters<typeof handleWompiWebhook>[0]["body"],
    checksumHeader,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true });
}
