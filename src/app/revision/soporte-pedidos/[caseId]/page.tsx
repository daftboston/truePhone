/**
 * @file page.tsx
 * @description Staff detail for one seller-submitted order-support case.
 * @dependencies next/link, auth session, order-support service and ops panel
 * @changelog 2026-09-11 — EmptyState on deny instead of a silent redirect.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderSupportOpsPanel } from "@/features/orders/components/order-support-ops-panel";
import { listingStatusLabel } from "@/features/listings/schemas/listing";
import { canAccessReviewPortal, getCurrentProfile } from "@/lib/auth/session";
import { formatOrderMoney, orderStatusLabel } from "@/lib/orders";
import {
  getOrderSupportCaseForStaff,
  orderSupportStatusLabel,
} from "@/lib/orders/order-support-service";
import { paymentStatusLabel } from "@/lib/payments";
import { shipmentStatusLabel, shippingMethodLabel } from "@/lib/shipping";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { caseId } = await params;
  return { title: `Soporte · ${caseId.slice(0, 8)}` };
}

/**
 * supportCaseTypeLabel
 *
 * Maps support type to a staff-facing title.
 *
 * @param type - Persisted support case type.
 * @returns Spanish label.
 * @calledBy OrderSupportCasePage
 */
function supportCaseTypeLabel(type: string) {
  if (type === "SELLER_CANCELLATION") return "Solicitud de cancelación";
  if (type === "FULFILLMENT_EXCEPTION") return "Problema con el envío";
  return "Soporte general";
}

/**
 * OrderSupportCasePage
 *
 * Shows order/listing/party context plus auditable support conversation and decisions.
 *
 * @param props.params - Support case route id.
 * @returns Staff-only case detail.
 */
export default async function OrderSupportCasePage({ params }: PageProps) {
  const { caseId } = await params;
  const current = await getCurrentProfile();
  if (!current) {
    redirect(`/login?next=/revision/soporte-pedidos/${caseId}`);
  }
  if (!canAccessReviewPortal(current.profile.role)) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden ver esta cola."
          action={
            <Button asChild variant="outline">
              <Link href="/perfil">Volver a Mi TruePhone</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const supportCase = await getOrderSupportCaseForStaff(caseId);
  if (!supportCase) notFound();

  const latestPayment = supportCase.order.payments[0];
  const shipment = supportCase.order.shipment;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/revision/soporte-pedidos">← Soporte de pedidos</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
            {supportCaseTypeLabel(supportCase.type)}
          </h1>
          <Badge variant="outline">
            {orderSupportStatusLabel(supportCase.status)}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Caso {supportCase.id} · Pedido {supportCase.orderId}
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="border-border space-y-3 rounded-xl border p-4">
          <h2 className="text-foreground text-sm font-semibold">
            Pedido y anuncio
          </h2>
          <div>
            <p className="text-foreground font-medium">
              {supportCase.order.listing.title}
            </p>
            <p className="text-muted-foreground text-xs">
              {supportCase.order.listing.iphoneModel.name}
            </p>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Pedido</dt>
              <dd>{orderStatusLabel(supportCase.order.status)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Anuncio</dt>
              <dd>{listingStatusLabel(supportCase.order.listing.status)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Total comprador</dt>
              <dd className="font-medium">
                {formatOrderMoney(
                  supportCase.order.totalPrice,
                  supportCase.order.currency,
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Liquidación congelada</dt>
              <dd>{supportCase.order.payoutFrozen ? "Sí" : "No"}</dd>
            </div>
          </dl>
          <Button asChild variant="outline" size="sm">
            <Link href={`/ventas/${supportCase.orderId}`}>
              Ver vista del vendedor
            </Link>
          </Button>
        </article>

        <article className="border-border space-y-3 rounded-xl border p-4">
          <h2 className="text-foreground text-sm font-semibold">
            Partes y cumplimiento
          </h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Vendedor</dt>
              <dd>
                {supportCase.order.seller.fullName ||
                  supportCase.order.seller.username ||
                  "Sin nombre"}{" "}
                · {supportCase.order.seller.city || "Sin ciudad"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Comprador</dt>
              <dd>
                {supportCase.order.buyer.fullName ||
                  supportCase.order.buyer.username ||
                  "Sin nombre"}{" "}
                · {supportCase.order.buyer.city || "Sin ciudad"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Envío</dt>
              <dd>
                {shipment
                  ? `${shippingMethodLabel(shipment.method)} · ${shipmentStatusLabel(shipment.status)}`
                  : "Sin método seleccionado"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Pago</dt>
              <dd>
                {latestPayment
                  ? `${latestPayment.provider === "MOCK" ? "Prueba" : "Wompi"} · ${paymentStatusLabel(latestPayment.status)}`
                  : "Sin pago"}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <OrderSupportOpsPanel
        supportCase={supportCase}
        currentStaffId={current.profile.id}
        currentStaffRole={current.profile.role}
      />
    </div>
  );
}
