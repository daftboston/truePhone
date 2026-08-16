/**
 * @file page.tsx
 * @description Admin payments overview: manual dispersion queue + checkout history.
 * @dependencies Payments/admin helpers, MarkManualPayoutButton
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkManualPayoutButton } from "@/features/payouts/components/mark-manual-payout-button";
import { getCurrentProfile, roleLabel } from "@/lib/auth/session";
import { formatOrderMoney } from "@/lib/orders";
import {
  countPaymentsByStatus,
  listRecentPayments,
  paymentStatusLabel,
} from "@/lib/payments";
import {
  countAuthorizedPayouts,
  listAuthorizedPayouts,
} from "@/lib/payments/ops-payouts";

export const metadata: Metadata = {
  title: "Pagos",
  description: "Liquidaciones manuales y historial de Compra Garantizada.",
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
 * Surfaces authorized payouts for manual Wompi pay + payment history.
 *
 * @returns Admin payments page.
 */
export default async function AdminPaymentsPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/pagos");

  if (current.profile.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Acceso restringido"
          description="Solo administradores pueden ver el historial de pagos."
          action={
            <Button asChild variant="outline">
              <Link href="/revision">Volver a revisión</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const [payments, counts, authorized, authorizedCount] = await Promise.all([
    listRecentPayments(80),
    countPaymentsByStatus(),
    listAuthorizedPayouts(50),
    countAuthorizedPayouts(),
  ]);

  const succeeded = counts.SUCCEEDED;
  const pending = counts.PENDING + counts.REQUIRES_ACTION;
  const failed = counts.FAILED;
  const refunded = counts.REFUNDED;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Pagos
          </h1>
          <Badge variant="outline">{roleLabel(current.profile.role)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Compra Garantizada: cobra el comprador, autoriza TruePhone, y paga al
          vendedor en Wompi (supervisión manual).
        </p>
      </div>

      <section className="space-y-3" aria-label="Liquidaciones pendientes">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-foreground text-sm font-semibold">
            Liquidaciones por pagar en Wompi
          </h2>
          <Badge variant="secondary">{authorizedCount}</Badge>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          1) Abre Wompi → Pagos a Terceros. 2) Transfiere el monto a la cuenta
          del vendedor. 3) Confirma aquí con «Ya pagué en Wompi».
        </p>
        {authorized.length === 0 ? (
          <EmptyState
            title="Nada pendiente de dispersión"
            description="Cuando un comprador confirme (o pasen 24 h), aparecerá aquí la liquidación autorizada."
          />
        ) : (
          <ul className="space-y-3">
            {authorized.map((payout) => {
              const bank = payout.sellerBankAccount;
              return (
                <li
                  key={payout.id}
                  className="border-border space-y-3 rounded-xl border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-foreground text-sm font-semibold">
                        {payout.order.listing.title}
                      </p>
                      <Badge variant="outline">Autorizada</Badge>
                    </div>
                    <p className="text-foreground text-lg font-semibold tabular-nums">
                      {formatOrderMoney(payout.amountPesos, payout.currency)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Pedido <span className="font-mono">{payout.orderId}</span>
                      {payout.authorizedAt
                        ? ` · autorizada ${formatWhen(payout.authorizedAt)}`
                        : null}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Vendedor:{" "}
                      {payout.order.seller.fullName ??
                        payout.order.seller.username ??
                        payout.order.seller.id}
                    </p>
                  </div>

                  {bank ? (
                    <dl className="bg-muted/50 grid gap-1 rounded-lg p-3 text-xs sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Titular</dt>
                        <dd className="text-foreground font-medium">
                          {bank.holderName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Documento</dt>
                        <dd className="text-foreground font-mono">
                          {bank.legalIdType} {bank.legalId}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Banco</dt>
                        <dd className="text-foreground">
                          {bank.bankName ?? bank.bankCode} (
                          {bank.accountType === "AHORROS"
                            ? "Ahorros"
                            : "Corriente"}
                          )
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Cuenta</dt>
                        <dd className="text-foreground font-mono">
                          {bank.accountNumber}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-muted-foreground">Email</dt>
                        <dd className="text-foreground">{bank.email}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-destructive text-xs" role="status">
                      El vendedor no tiene cuenta bancaria. Pídele que la
                      agregue en Pagos.
                    </p>
                  )}

                  {payout.order.payoutFrozen ? (
                    <p className="text-destructive text-xs" role="status">
                      Pago congelado — no marques como pagado hasta resolver la
                      disputa.
                    </p>
                  ) : (
                    <MarkManualPayoutButton payoutId={payout.id} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="Resumen de cobros"
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

      <section className="space-y-3" aria-label="Historial de cobros">
        <h2 className="text-foreground text-sm font-semibold">
          Cobros recientes (checkout)
        </h2>
        {payments.length === 0 ? (
          <EmptyState
            title="Sin cobros todavía"
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
    </div>
  );
}
