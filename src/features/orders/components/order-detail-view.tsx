/**
 * @file order-detail-view.tsx
 * @description OrderDetailView component for the orders feature.tsx.
 * @dependencies next/link, price-display, order actions, financial-core settlement-guards
 */

import Link from "next/link";

import { PriceDisplay } from "@/components/price-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuyerAbandonChoice } from "@/features/orders/components/buyer-abandon-choice";
import { OrderStatusActions } from "@/features/orders/components/order-status-actions";
import { OrderTimeline } from "@/features/orders/components/order-timeline";
import { PayOrderButton } from "@/features/payments/components/pay-order-button";
import { PartyCard } from "@/features/profile/components/party-card";
import { OrderReviewsSection } from "@/features/reviews/components/order-reviews-section";
import { OrderShippingPanel } from "@/features/shipping/components/order-shipping-panel";
import { buyerCanChooseRefundOrLoyalty } from "@/lib/financial-core/buyer-abandon-choice";
import { canCancelPaidOrder } from "@/lib/financial-core/settlement-guards";
import {
  formatOrderMoney,
  orderStatusLabel,
  type OrderDetail,
} from "@/lib/orders";
import type { PublicActivityCounts } from "@/lib/profile-activity";
import { paymentStatusLabel } from "@/lib/payments";
import { publicListingPath } from "@/lib/listings-marketplace";
import { canAccessReviewPortal } from "@/lib/auth/session";

type OrderDetailViewProps = {
  order: OrderDetail;
  perspective: "buyer" | "seller";
  currentUserId: string;
  currentUserRole?: string;
  backHref: string;
  backLabel: string;
  paymentNotice?: string | null;
  /** Seller has no default bank yet — show payout destination reminder. */
  needsBankAccount?: boolean;
  buyerActivity: PublicActivityCounts;
  sellerActivity: PublicActivityCounts;
};

/**
 * formatWhen
 *
 * Formats an order timestamp for es-CO display.
 *
 * @param date - Instant to format.
 * @returns Localized date and time string.
 * @calledBy OrderDetailView
 */
function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

/**
 * paymentStatusCopy
 *
 * Supports orders by implementing paymentStatusCopy.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy orders UI and related modules
 */
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
    if (latest?.status === "SUCCEEDED") {
      return "Pagado · compensación pendiente";
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

/**
 * OrderDetailView
 *
 * Renders buyer or seller order detail: fee summary, pay CTA, timeline,
 * shipping panel, and settlement reminders.
 *
 * @param props.order - Loaded order with payments, shipment, reviews.
 * @param props.perspective - Buyer or seller view.
 * @param props.currentUserId - Authenticated profile id.
 * @param props.currentUserRole - Role for ops shipping tools.
 * @param props.backHref - Hub link (compras / ventas).
 * @param props.backLabel - Back link label.
 * @param props.paymentNotice - Optional post-checkout status banner.
 * @param props.needsBankAccount - Seller missing default bank destination.
 * @param props.buyerActivity - Public listing/purchase counters for the buyer.
 * @param props.sellerActivity - Public listing/purchase counters for the seller.
 * @returns Order detail layout.
 * @calledBy `/compras/[orderId]`, `/ventas/[orderId]`
 */
export function OrderDetailView({
  order,
  perspective,
  currentUserId,
  currentUserRole,
  backHref,
  backLabel,
  paymentNotice,
  needsBankAccount = false,
  buyerActivity,
  sellerActivity,
}: OrderDetailViewProps) {
  const isBuyer = perspective === "buyer";
  const canCancel =
    order.status === "AWAITING_PAYMENT" ||
    (order.status === "PAID" && canCancelPaidOrder(order));
  const canPay = isBuyer && order.status === "AWAITING_PAYMENT";
  const feePercent = Math.round(order.feeRateBps / 100);
  const listingHref =
    order.listing.status === "PUBLISHED"
      ? publicListingPath(order.listing.slug)
      : isBuyer
        ? null
        : `/vender/${order.listingId}`;
  const isOps = canAccessReviewPortal(currentUserRole ?? "");
  const showAbandonChoice = buyerCanChooseRefundOrLoyalty({
    orderStatus: order.status,
    isBuyer,
    entitlement: order.feeEntitlementSource,
  });
  const showBankReminder =
    !isBuyer &&
    needsBankAccount &&
    order.status === "PAID" &&
    !order.payoutCompletedAt;

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
        {showBankReminder ? (
          <p
            className="text-foreground bg-muted/60 rounded-lg px-3 py-2 text-sm"
            role="status"
          >
            Agrega tu cuenta bancaria para recibir el pago. Sin una cuenta
            predeterminada, TruePhone no puede liberar tu liquidación cuando el
            comprador confirme (o pasen las 24 horas).{" "}
            <Link href="/pagos" className="underline underline-offset-2">
              Ir a Pagos
            </Link>
          </p>
        ) : null}
      </div>

      <section
        className="grid gap-3 sm:grid-cols-2"
        aria-label="Vendedor y comprador"
      >
        <PartyCard
          roleLabel="Vendedor"
          fullName={order.seller.fullName}
          username={order.seller.username}
          avatarUrl={order.seller.avatarUrl}
          createdAt={order.seller.createdAt}
          sellerRating={order.seller.sellerRating}
          verifikStatus={order.seller.verifikStatus}
          activity={sellerActivity}
        />
        <PartyCard
          roleLabel="Comprador"
          fullName={order.buyer.fullName}
          username={order.buyer.username}
          avatarUrl={order.buyer.avatarUrl}
          createdAt={order.buyer.createdAt}
          sellerRating={order.buyer.sellerRating}
          verifikStatus={order.buyer.verifikStatus}
          activity={buyerActivity}
        />
      </section>

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
        <Button asChild variant="outline" size="sm">
          <Link
            href={
              isBuyer
                ? `/mensajes/${order.listingId}`
                : `/mensajes/${order.listingId}?con=${order.buyer.id}`
            }
          >
            {isBuyer ? "Contactar vendedor" : "Contactar comprador"}
          </Link>
        </Button>
      </section>

      {showAbandonChoice ? <BuyerAbandonChoice orderId={order.id} /> : null}

      {canPay ? (
        <section className="border-border space-y-3 rounded-xl border p-4">
          <h2 className="text-foreground text-sm font-semibold">
            Compra Garantizada
          </h2>
          <p className="text-muted-foreground text-sm">
            Paga el total ya mostrado (equipo + protección {feePercent}%). Sin
            cargos sorpresa. TruePhone retiene el pago hasta que confirmes el
            iPhone, o hasta 24 horas después de marcar «Ya recibí».
          </p>
          <PayOrderButton
            orderId={order.id}
            totalPrice={order.totalPrice}
            platformFee={order.platformFee}
            feePercent={feePercent}
            currency={order.currency}
          />
        </section>
      ) : null}

      <section className="border-border space-y-3 rounded-xl border p-4">
        <h2 className="text-foreground text-sm font-semibold">Timeline</h2>
        <OrderTimeline order={order} />
      </section>

      <OrderShippingPanel
        orderId={order.id}
        orderStatus={order.status}
        perspective={perspective}
        isOps={isOps}
        sellerCity={order.seller.city}
        shipment={order.shipment}
        buyerConfirmDeadlineAt={order.buyerConfirmDeadlineAt}
        buyerConfirmedAt={order.buyerConfirmedAt}
        payoutFrozen={order.payoutFrozen}
        premiumShippingFeePesos={order.premiumShippingFeePesos}
        currency={order.currency}
      />

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
              Protección TruePhone ({feePercent}%)
            </span>
            <span>{formatOrderMoney(order.platformFee, order.currency)}</span>
          </li>
          {order.premiumShippingFeePesos > 0 ? (
            <li className="flex justify-between gap-4 py-1">
              <span className="text-muted-foreground">
                Premium Bogotá (vendedor)
              </span>
              <span>
                −
                {formatOrderMoney(
                  order.premiumShippingFeePesos,
                  order.currency,
                )}
              </span>
            </li>
          ) : null}
          <li className="border-border flex justify-between gap-4 border-t py-2 font-semibold">
            <span>Total comprador</span>
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
        isPaid={order.status === "PAID"}
        isSeller={!isBuyer}
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
