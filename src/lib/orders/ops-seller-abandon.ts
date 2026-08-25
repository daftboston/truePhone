/**
 * @file ops-seller-abandon.ts
 * @description Ops queries for PAID orders eligible for seller-abandon cancel.
 * @dependencies prisma, @/lib/financial-core/settlement-guards
 */

import type { Prisma } from "@prisma/client";

import { canCancelPaidOrder } from "@/lib/financial-core/settlement-guards";
import { prisma } from "@/lib/db";

const opsSellerAbandonSelect = {
  id: true,
  status: true,
  currency: true,
  totalPrice: true,
  paidAt: true,
  createdAt: true,
  payoutCompletedAt: true,
  payoutAuthorizedAt: true,
  buyerConfirmedAt: true,
  buyerConfirmDeadlineAt: true,
  sellerFulfillmentAbandonedAt: true,
  listing: {
    select: { id: true, title: true, slug: true, status: true },
  },
  buyer: {
    select: { id: true, fullName: true, username: true },
  },
  seller: {
    select: { id: true, fullName: true, username: true },
  },
} satisfies Prisma.OrderSelect;

export type OpsSellerAbandonOrder = Prisma.OrderGetPayload<{
  select: typeof opsSellerAbandonSelect;
}>;

/**
 * isEligibleForOpsSellerAbandonCancel
 *
 * True when the order is PAID and still in the pre-settlement cancel window.
 *
 * @param order - Settlement timestamps + status.
 * @returns Whether ops may run seller-abandon cancel.
 * @calledBy list / find helpers and `/revision/cancelaciones`
 */
export function isEligibleForOpsSellerAbandonCancel(
  order: Pick<
    OpsSellerAbandonOrder,
    | "status"
    | "payoutCompletedAt"
    | "payoutAuthorizedAt"
    | "buyerConfirmedAt"
    | "buyerConfirmDeadlineAt"
  >,
): boolean {
  return order.status === "PAID" && canCancelPaidOrder(order);
}

/**
 * listPaidOrdersForOpsSellerAbandon
 *
 * Recent PAID orders still cancellable as seller abandon (support / no-ship).
 *
 * @param take - Max rows (newest paid first).
 * @returns Eligible orders for the ops queue.
 * @calledBy `/revision/cancelaciones`
 */
export async function listPaidOrdersForOpsSellerAbandon(take = 40) {
  const rows = await prisma.order.findMany({
    where: {
      status: "PAID",
      payoutCompletedAt: null,
      payoutAuthorizedAt: null,
      buyerConfirmedAt: null,
      buyerConfirmDeadlineAt: null,
      sellerFulfillmentAbandonedAt: null,
    },
    select: opsSellerAbandonSelect,
    orderBy: { paidAt: "desc" },
    take,
  });
  return rows.filter(isEligibleForOpsSellerAbandonCancel);
}

/**
 * countPaidOrdersForOpsSellerAbandon
 *
 * Count of PAID orders eligible for ops seller-abandon cancel.
 *
 * @returns Queue size for the revision hub card.
 * @calledBy ReviewHubPage
 */
export async function countPaidOrdersForOpsSellerAbandon() {
  return prisma.order.count({
    where: {
      status: "PAID",
      payoutCompletedAt: null,
      payoutAuthorizedAt: null,
      buyerConfirmedAt: null,
      buyerConfirmDeadlineAt: null,
      sellerFulfillmentAbandonedAt: null,
    },
  });
}

/**
 * findOrderForOpsSellerAbandon
 *
 * Loads one order by id for the ops cancel form (any status; UI checks eligibility).
 *
 * @param orderId - Order UUID from support mailto.
 * @returns Order row or null.
 * @calledBy `/revision/cancelaciones` lookup
 */
export async function findOrderForOpsSellerAbandon(orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId },
    select: opsSellerAbandonSelect,
  });
}
