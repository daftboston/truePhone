/**
 * @file page.tsx
 * @description Admin payments overview for holds, payouts, and payment ops.
 * @dependencies Payments/admin helpers
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentProfile, roleLabel } from "@/lib/auth/session";
import { formatOrderMoney } from "@/lib/orders";
import {
  countPaymentsByStatus,
  listRecentPayments,
  paymentStatusLabel,
} from "@/lib/payments";

export const metadata: Metadata = {
  title: "Pagos",
  description: "Historial de pagos Compra Garantizada.",
};

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * AdminPaymentsPage
 *
 * Surfaces payment and payout review tools for staff.
 *
 * @returns Admin payments page.
 */
export default async function AdminPaymentsPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/pagos");

  if (current.profile.role !== "ADMIN") {
    return (
      <AppShell mainClassName="max-w-lg justify-center">
        <EmptyState
          title="Acceso restringido"
          description="Solo administradores pueden ver el historial de pagos."
          action={
            <Button asChild variant="outline">
              <Link href="/revision">Volver a revisión</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const [payments, counts] = await Promise.all([
    listRecentPayments(80),
    countPaymentsByStatus(),
  ]);

  const succeeded = counts.SUCCEEDED;
  const pending = counts.PENDING + counts.REQUIRES_ACTION;
  const failed = counts.FAILED;
  const refunded = counts.REFUNDED;

  return (
    <AppShell mainClassName="max-w-3xl gap-8">
      <div className="space-y-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/revision">← Cola de confianza</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Pagos
          </h1>
          <Badge variant="outline">{roleLabel(current.profile.role)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Compra Garantizada: cobros del total (equipo + protección 10%).
        </p>
      </div>

      <section
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="Resumen de pagos"
      >
        {[
          { label: "Pagados", value: succeeded },
          { label: "Pendientes", value: pending },
          { label: "Fallidos", value: failed },
          { label: "Reembolsos", value: refunded },
        ].map((item) => (
          <div key={item.label} className="border-border rounded-xl border p-3">
            <p className="text-muted-foreground text-xs">{item.label}</p>
            <p className="text-foreground text-2xl font-semibold tabular-nums">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-3" aria-label="Historial">
        <h2 className="text-foreground text-sm font-semibold">Recientes</h2>
        {payments.length === 0 ? (
          <EmptyState
            title="Sin pagos todavía"
            description="Cuando un comprador inicie Compra Garantizada, aparecerá aquí."
          />
        ) : (
          <ul className="space-y-2">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="border-border flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-foreground truncate text-sm font-semibold">
                      {payment.order.listing.title}
                    </p>
                    <Badge variant="outline">
                      {paymentStatusLabel(payment.status)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {formatWhen(payment.createdAt)} ·{" "}
                    {payment.provider === "MOCK" ? "Prueba" : "Wompi"} · pedido{" "}
                    <span className="font-mono">{payment.orderId}</span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Ref <span className="font-mono">{payment.reference}</span> ·
                    Protección:{" "}
                    {formatOrderMoney(payment.platformFee, payment.currency)} ·
                    Total: {formatOrderMoney(payment.amount, payment.currency)}
                  </p>
                  {payment.failureMessage ? (
                    <p className="text-destructive text-xs">
                      {payment.failureMessage}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
