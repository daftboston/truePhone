import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderDetailView } from "@/features/orders/components/order-detail-view";
import { requireCurrentProfile } from "@/lib/auth/session";
import { getOrderForParticipant } from "@/lib/orders";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { orderId } = await params;
  return { title: `Venta · ${orderId.slice(0, 8)}` };
}

export default async function SellerOrderPage({ params }: PageProps) {
  const { orderId } = await params;
  const current = await requireCurrentProfile(`/ventas/${orderId}`);
  const order = await getOrderForParticipant(orderId, current.profile.id);

  if (!order || order.sellerId !== current.profile.id) {
    notFound();
  }

  return (
    <OrderDetailView
      order={order}
      perspective="seller"
      currentUserId={current.profile.id}
      backHref="/ventas"
      backLabel="← Mis ventas"
    />
  );
}
