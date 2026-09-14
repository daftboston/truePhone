/**
 * @file page.tsx
 * @description Buyer order detail for a single purchase.
 * @dependencies Order detail components and order loaders
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderDetailView } from "@/features/orders/components/order-detail-view";
import { requireCurrentProfile } from "@/lib/auth/session";
import { getOrderForParticipant } from "@/lib/orders";
import { getOrderPartyActivity } from "@/lib/profile-activity";

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ pago?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { orderId } = await params;
  return { title: `Pedido · ${orderId.slice(0, 8)}` };
}

function paymentNoticeFromQuery(pago: string | undefined, orderStatus: string) {
  if (pago === "ok" || orderStatus === "PAID" || orderStatus === "COMPLETED") {
    if (pago === "ok" || pago === "regreso") {
      if (orderStatus === "PAID" || orderStatus === "COMPLETED") {
        return "Tu pago de Compra Garantizada está confirmado.";
      }
      return "Estamos confirmando tu pago. Esto puede tardar unos segundos.";
    }
  }
  if (pago === "regreso" && orderStatus === "AWAITING_PAYMENT") {
    return "Si ya pagaste, la confirmación llegará en unos segundos. Si no, puedes reintentar el pago.";
  }
  return null;
}

/**
 * BuyerOrderPage
 *
 * Shows purchase order status, payment, and shipping actions for the buyer.
 *
 * @returns Order detail view scoped to the buyer.
 */
export default async function BuyerOrderPage({
  params,
  searchParams,
}: PageProps) {
  const { orderId } = await params;
  const { pago } = await searchParams;
  const current = await requireCurrentProfile(`/compras/${orderId}`);
  const order = await getOrderForParticipant(orderId, current.profile.id);

  if (!order || order.buyerId !== current.profile.id) {
    notFound();
  }

  const partyActivity = await getOrderPartyActivity({
    buyerId: order.buyerId,
    sellerId: order.sellerId,
  });

  return (
    <OrderDetailView
      order={order}
      perspective="buyer"
      currentUserId={current.profile.id}
      currentUserRole={current.profile.role}
      backHref="/compras"
      backLabel="← Mis compras"
      paymentNotice={paymentNoticeFromQuery(pago, order.status)}
      buyerActivity={partyActivity.buyer}
      sellerActivity={partyActivity.seller}
    />
  );
}
