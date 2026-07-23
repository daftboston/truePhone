import Link from "next/link";

import { PriceDisplay } from "@/components/price-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderStatusActions } from "@/features/orders/components/order-status-actions";
import { OrderTimeline } from "@/features/orders/components/order-timeline";
import { PayOrderButton } from "@/features/payments/components/pay-order-button";
import { OrderReviewsSection } from "@/features/reviews/components/order-reviews-section";
import {
  formatOrderMoney,
  orderStatusLabel,
  type OrderDetail,
} from "@/lib/orders";
import { paymentStatusLabel } from "@/lib/payments";
import { publicListingPath } from "@/lib/listings-marketplace";

type OrderDetailViewProps = {
  order: OrderDetail;
  perspective: "buyer" | "seller";
  currentUserId: string;
  backHref: string;
  backLabel: string;
  paymentNotice?: string | null;
};

function partyName(party: OrderDetail["buyer"] | OrderDetail["seller"]) {
  return party.fullName?.trim() || party.username || "Usuario TruePhone";
}

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function paymentStatusCopy(order: OrderDetail) {
  const latest = order.payments[0];
  if (order.status === "COMPLETED" || order.status === "PAID") {
    return order.paidAt
      ? `Confirmado · ${formatWhen(order.paidAt)}`
      : "Confirmado";
  }
  if (order.status === "CANCELLED") {
    if (latest?.status === "REFUNDED") {
      return "Reembolsado";
    }
    return "Cancelado · sin cobro";
  }
  if (latest?.status === "FAILED") {
    return latest.failureMessage || "Pago fallido · puedes reintentar";
  }
  if (latest?.status === "REQUIRES_ACTION") {
    return "Checkout abierto · completa el pago";
  }
  return "Pendiente · Compra Garantizada";
}

export function OrderDetailView({
  order,
  perspective,
  currentUserId,
  backHref,
  backLabel,
  paymentNotice,
}: OrderDetailViewProps) {
  const isBuyer = perspective === "buyer";
  const other = isBuyer ? order.seller : order.buyer;
  const otherLabel = isBuyer ? "Vendedor" : "Comprador";
  const canCancel =
    order.status === "AWAITING_PAYMENT" || order.status === "PAID";
  const canComplete = !isBuyer && order.status === "PAID";
  const canPay = isBuyer && order.status === "AWAITING_PAYMENT";
  const listingHref =
    order.listing.status === "PUBLISHED"
      ? publicListingPath(order.listing.slug)
      : isBuyer
        ? null
        : `/vender/${order.listingId}`;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button asChild variant="outline" size="sm">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Pedido
          </h1>
          <Badge variant="outline">{orderStatusLabel(order.status)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">{order.listing.title}</p>
        {paymentNotice ? (
          <p
            className="text-foreground bg-muted/60 rounded-lg px-3 py-2 text-sm"
            role="status"
          >
            {paymentNotice}
          </p>
        ) : null}
      </div>

      <section className="border-border space-y-3 rounded-xl border p-4">
        <h2 className="text-foreground text-sm font-semibold">Resumen</h2>
        <PriceDisplay
          price={order.totalPrice}
          equipmentPrice={order.equipmentPrice}
          protectionFee={order.platformFee}
          currency={order.currency}
          className="[&>p]:text-xl"
        />
        <dl className="text-muted-foreground grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt>{otherLabel}</dt>
            <dd className="text-foreground font-medium">{partyName(other)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Creado</dt>
            <dd className="text-foreground">{formatWhen(order.createdAt)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Pago</dt>
            <dd className="text-foreground">{paymentStatusCopy(order)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Total</dt>
            <dd className="text-foreground font-semibold">
              {formatOrderMoney(order.totalPrice, order.currency)}
            </dd>
          </div>
        </dl>
        {listingHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={listingHref}>Ver anuncio</Link>
          </Button>
        ) : null}
      </section>

      {canPay ? (
        <section className="border-border space-y-3 rounded-xl border p-4">
          <h2 className="text-foreground text-sm font-semibold">
            Compra Garantizada
          </h2>
          <p className="text-muted-foreground text-sm">
            Paga el total ya mostrado (equipo + protección 6%). Sin cargos
            sorpresa.
          </p>
          <PayOrderButton
            orderId={order.id}
            totalPrice={order.totalPrice}
            platformFee={order.platformFee}
            currency={order.currency}
          />
        </section>
      ) : null}

      <section className="border-border space-y-3 rounded-xl border p-4">
        <h2 className="text-foreground text-sm font-semibold">Timeline</h2>
        <OrderTimeline order={order} />
      </section>

      <section className="border-border space-y-3 rounded-xl border p-4">
        <h2 className="text-foreground text-sm font-semibold">Recibo</h2>
        <p className="text-muted-foreground text-xs">
          ID del pedido:{" "}
          <span className="text-foreground font-mono">{order.id}</span>
        </p>
        <ul className="text-sm">
          <li className="flex justify-between gap-4 py-1">
            <span className="text-muted-foreground">Equipo</span>
            <span>
              {formatOrderMoney(order.equipmentPrice, order.currency)}
            </span>
          </li>
          <li className="flex justify-between gap-4 py-1">
            <span className="text-muted-foreground">
              Protección TruePhone (6%)
            </span>
            <span>{formatOrderMoney(order.platformFee, order.currency)}</span>
          </li>
          <li className="border-border flex justify-between gap-4 border-t py-2 font-semibold">
            <span>Total</span>
            <span>{formatOrderMoney(order.totalPrice, order.currency)}</span>
          </li>
        </ul>
        {order.payments.length > 0 ? (
          <div className="border-border space-y-2 border-t pt-3">
            <p className="text-foreground text-xs font-semibold tracking-wide uppercase">
              Historial de pagos
            </p>
            <ul className="space-y-2 text-sm">
              {order.payments.map((payment) => (
                <li
                  key={payment.id}
                  className="text-muted-foreground flex flex-wrap items-center justify-between gap-2"
                >
                  <span>
                    {paymentStatusLabel(payment.status)}
                    {payment.provider === "MOCK" ? " · prueba" : " · Wompi"}
                  </span>
                  <span className="text-foreground font-mono text-xs">
                    {payment.reference}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {order.cancelReason ? (
          <p className="text-muted-foreground text-sm">
            Motivo de cancelación: {order.cancelReason}
          </p>
        ) : null}
      </section>

      <OrderStatusActions
        orderId={order.id}
        canCancel={canCancel}
        canComplete={canComplete}
        isPaid={order.status === "PAID"}
      />

      <OrderReviewsSection
        orderId={order.id}
        orderStatus={order.status}
        completedAt={order.completedAt}
        perspective={perspective}
        currentUserId={currentUserId}
        reviews={order.reviews}
      />
    </div>
  );
}
