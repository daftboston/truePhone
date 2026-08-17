/**
 * @file ops-payouts.ts
 * @description Admin helpers for authorized (manual) seller payout queue.
 * @dependencies prisma
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

/**
 * Only AUTHORIZED payouts on unfrozen PAID orders. Cancelled / completed
 * orders must not appear in the ops dispersion queue.
 */
export const authorizedManualPayoutWhere = {
  status: "AUTHORIZED",
  order: { status: "PAID", payoutFrozen: false },
} satisfies Prisma.PayoutWhereInput;

/**
 * countAuthorizedPayouts
 *
 * Counts payouts waiting for ops to pay in Wompi (AUTHORIZED).
 *
 * @returns Count of AUTHORIZED payout rows.
 * @calledBy Review hub, admin payments page
 */
export async function countAuthorizedPayouts() {
  return prisma.payout.count({
    where: authorizedManualPayoutWhere,
  });
}

/**
 * listAuthorizedPayouts
 *
 * Lists AUTHORIZED payouts with order + seller bank details for manual dispersion.
 *
 * @param limit - Max rows (default 50).
 * @returns Payout rows with nested order/listing/bank.
 * @calledBy AdminPaymentsPage
 */
export async function listAuthorizedPayouts(limit = 50) {
  return prisma.payout.findMany({
    where: authorizedManualPayoutWhere,
    orderBy: { authorizedAt: "asc" },
    take: limit,
    include: {
      sellerBankAccount: true,
      order: {
        select: {
          id: true,
          sellerAmountPesos: true,
          currency: true,
          buyerConfirmedAt: true,
          buyerConfirmDeadlineAt: true,
          payoutFrozen: true,
          listing: { select: { id: true, title: true, slug: true } },
          seller: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      },
    },
  });
}
