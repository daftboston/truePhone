import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { MockCheckoutConfirm } from "@/features/payments/components/mock-checkout-confirm";
import { requireCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isMockPaymentsEnabled } from "@/lib/payments/resolve-provider";

export const metadata: Metadata = {
  title: "Pago de prueba",
  description: "Simulación de checkout TruePhone (solo desarrollo).",
};

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ reference?: string }>;
};

export default async function MockCheckoutPage({
  params,
  searchParams,
}: PageProps) {
  if (!isMockPaymentsEnabled()) {
    notFound();
  }

  const { orderId } = await params;
  const { reference } = await searchParams;
  const current = await requireCurrentProfile(`/compras/${orderId}/pagar/mock`);

  if (!reference) {
    redirect(`/compras/${orderId}`);
  }

  const payment = await prisma.payment.findFirst({
    where: {
      reference,
      orderId,
      provider: "MOCK",
      buyerId: current.profile.id,
    },
    include: {
      order: {
        include: {
          listing: { select: { title: true } },
        },
      },
    },
  });

  if (!payment) {
    notFound();
  }

  if (payment.status === "SUCCEEDED") {
    redirect(`/compras/${orderId}?pago=ok`);
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="space-y-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/compras/${orderId}`}>Volver al pedido</Link>
        </Button>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Checkout de prueba
        </h1>
        <p className="text-muted-foreground text-sm">
          Confirma el pago simulado para marcar Compra Garantizada como pagada.
        </p>
      </div>
      <div className="border-border rounded-xl border p-4">
        <MockCheckoutConfirm
          reference={payment.reference}
          amount={payment.amount}
          currency={payment.currency}
          listingTitle={payment.order.listing.title}
        />
      </div>
    </div>
  );
}
