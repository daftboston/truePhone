/**
 * @file page.tsx
 * @description Seller order detail for a single sale.
 * @dependencies Order detail components, order loaders, prisma bank lookup
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderDetailView } from "@/features/orders/components/order-detail-view";
import { requireCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
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

/**
 * sellerHasDefaultBankAccount
 *
 * Returns true when the seller has a default bank destination for payouts.
 *
 * @param profileId - Seller profile UUID.
 * @returns Whether a default SellerBankAccount row exists.
 * @calledBy SellerOrderPage
 */
async function sellerHasDefaultBankAccount(profileId: string) {
  const row = await prisma.sellerBankAccount.findFirst({
    where: { profileId, isDefault: true },
    select: { id: true },
  });
  return Boolean(row);
}

/**
 * SellerOrderPage
 *
 * Shows sale order status, payout, and shipping actions for the seller.
 *
 * @returns Order detail view scoped to the seller.
 */
export default async function SellerOrderPage({ params }: PageProps) {
  const { orderId } = await params;
  const current = await requireCurrentProfile(`/ventas/${orderId}`);
  const order = await getOrderForParticipant(orderId, current.profile.id);

  if (!order || order.sellerId !== current.profile.id) {
    notFound();
  }

  const hasBank = await sellerHasDefaultBankAccount(current.profile.id);

  return (
    <OrderDetailView
      order={order}
      perspective="seller"
      currentUserId={current.profile.id}
      currentUserRole={current.profile.role}
      backHref="/ventas"
      backLabel="← Mis ventas"
      needsBankAccount={!hasBank}
    />
  );
}
