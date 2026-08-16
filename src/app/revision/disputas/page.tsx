/**
 * @file page.tsx
 * @description Admin queue for frozen payouts, chargebacks, and manual refunds.
 * @dependencies ops-disputes queries, OpsDisputeActions, RecordChargebackForm
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OpsDisputeActions } from "@/features/disputes/components/ops-dispute-actions";
import { RecordChargebackForm } from "@/features/disputes/components/record-chargeback-form";
import { getCurrentProfile, roleLabel } from "@/lib/auth/session";
import { formatOrderMoney } from "@/lib/format-money";
import {
  classifyOpsDisputeCase,
  defaultRefundReasonForKind,
  listManualRefundPayments,
  listOpsDisputeOrders,
} from "@/lib/payments/ops-disputes";

export const metadata: Metadata = {
  title: "Disputas y contracargos",
  description:
    "Congela, reembolsa o absorbe contracargos según el modelo financiero TruePhone.",
};

/**
 * formatWhen
 *
 * Formats a timestamp for ops queue cards.
 *
 * @param date - Instant to display.
 * @returns Medium es-CO date and short time.
 * @calledBy AdminDisputesPage
 */
function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * partyName
 *
 * Short display name for buyer/seller on an ops card.
 *
 * @param party - Profile name fields.
 * @returns Full name, username, or id.
 * @calledBy AdminDisputesPage
 */
function partyName(party: {
  fullName: string | null;
  username: string | null;
  id: string;
}) {
  return party.fullName ?? party.username ?? party.id;
}

/**
 * AdminDisputesPage
 *
 * ADMIN-only queue: frozen PAID orders, open chargebacks, Wompi refund reconcile.
 *
 * @returns Disputes ops page.
 */
export default async function AdminDisputesPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/disputas");

  if (current.profile.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Acceso restringido"
          description="Solo administradores pueden gestionar contracargos y reembolsos."
          action={
            <Button asChild variant="outline">
              <Link href="/revision">Volver a revisión</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const [orders, manualRefunds] = await Promise.all([
    listOpsDisputeOrders(50),
    listManualRefundPayments(30),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Disputas y contracargos
          </h1>
          <Badge variant="outline">{roleLabel(current.profile.role)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          TruePhone absorbe contracargos contra la Cuenta Wompi. Si el vendedor
          aún no se liquidó, congela el pago. Si ya se pagó, registra la pérdida
          y no intentes revertir al vendedor desde aquí.
        </p>
      </div>

      <section className="space-y-3" aria-label="Cola abierta">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-foreground text-sm font-semibold">
            Casos abiertos
          </h2>
          <Badge variant="secondary">{orders.length}</Badge>
        </div>
        {orders.length === 0 ? (
          <EmptyState
            title="Nada congelado"
            description="Cuando un comprador reporte un problema, falle la inspección Premium o Wompi anule un cobro, aparecerá aquí."
          />
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => {
              const classified = classifyOpsDisputeCase(order);
              const payment = order.payments[0] ?? null;
              const latestMemo = order.ledgerEntries[0]?.memo;
              return (
                <li
                  key={order.id}
                  className="border-border space-y-4 rounded-xl border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-foreground text-sm font-semibold">
                        {order.listing.title}
                      </p>
                      <Badge variant="outline">{classified.label}</Badge>
                    </div>
                    <p className="text-foreground text-lg font-semibold tabular-nums">
                      {formatOrderMoney(order.totalPrice, order.currency)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Pedido <span className="font-mono">{order.id}</span>
                      {order.updatedAt
                        ? ` · actualizado ${formatWhen(order.updatedAt)}`
                        : null}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Comprador: {partyName(order.buyer)} · Vendedor:{" "}
                      {partyName(order.seller)}
                    </p>
                    {payment?.providerPaymentId ? (
                      <p className="text-muted-foreground text-xs">
                        Wompi{" "}
                        <span className="font-mono">
                          {payment.providerPaymentId}
                        </span>
                      </p>
                    ) : null}
                    {latestMemo ? (
                      <p className="text-muted-foreground text-xs">
                        Ledger: {latestMemo}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/compras/${order.id}`}>Ver compra</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/ventas/${order.id}`}>Ver venta</Link>
                      </Button>
                    </div>
                  </div>
                  <OpsDisputeActions
                    orderId={order.id}
                    paymentId={payment?.id ?? null}
                    kind={classified.kind}
                    defaultRefundReason={defaultRefundReasonForKind(
                      classified.kind,
                    )}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-label="Reembolsos manuales en Wompi">
        <h2 className="text-foreground text-sm font-semibold">
          Reembolsos por conciliar en Wompi
        </h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          El ledger ya registró el reembolso, pero el proveedor no anuló el
          cobro. Completa el void en el dashboard de Wompi.
        </p>
        {manualRefunds.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay voids pendientes de conciliar.
          </p>
        ) : (
          <ul className="space-y-2">
            {manualRefunds.map((payment) => (
              <li
                key={payment.id}
                className="border-border space-y-1 rounded-xl border p-3"
              >
                <p className="text-foreground text-sm font-semibold">
                  {payment.order.listing.title}
                </p>
                <p className="text-foreground text-sm tabular-nums">
                  {formatOrderMoney(
                    payment.refundAmount ?? payment.amount,
                    payment.currency,
                  )}
                </p>
                <p className="text-muted-foreground text-xs">
                  Pedido <span className="font-mono">{payment.orderId}</span>
                  {payment.providerPaymentId ? (
                    <>
                      {" "}
                      · Wompi{" "}
                      <span className="font-mono">
                        {payment.providerPaymentId}
                      </span>
                    </>
                  ) : null}
                </p>
                {payment.failureMessage ? (
                  <p className="text-destructive text-xs">
                    {payment.failureMessage}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-label="Registro manual">
        <h2 className="text-foreground text-sm font-semibold">
          Registrar contracargo a mano
        </h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Usa esto si Wompi avisó en el dashboard y el webhook no llegó. El
          cobro debe estar exitoso o ya anulado.
        </p>
        <RecordChargebackForm />
      </section>
    </div>
  );
}
