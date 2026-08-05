/**
 * @file route.ts
 * @description Mock PSP checkout entry that redirects to the in-app confirm page.
 * @dependencies prisma, isMockPaymentsEnabled
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { isMockPaymentsEnabled } from "@/lib/payments/resolve-provider";

export const runtime = "nodejs";

/**
 * Mock PSP checkout entry — redirects to an in-app confirm page.
 * GET /api/payments/mock/checkout?reference=…&redirect=…
 */
export async function GET(request: Request) {
  if (!isMockPaymentsEnabled()) {
    return NextResponse.json(
      { error: "Mock payments deshabilitado." },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Falta reference." }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { reference, provider: "MOCK" },
    select: { orderId: true },
  });
  if (!payment) {
    return NextResponse.json({ error: "Pago no encontrado." }, { status: 404 });
  }

  const url = new URL(`/compras/${payment.orderId}/pagar/mock`, request.url);
  url.searchParams.set("reference", reference);
  return NextResponse.redirect(url);
}
