/**
 * @file open-payouts.ts
 * @description Cancels AUTHORIZED / PENDING / SUBMITTED payouts so cancelled or
 * frozen orders cannot be dispersed (FINANCIAL_MODEL.md §5).
 * @dependencies @prisma/client, ledger
 */

import { Prisma } from "@prisma/client";

import { appendLedgerEntry } from "@/lib/financial-core/ledger";

export const OPEN_PAYOUT_STATUSES = [
  "PENDING",
  "AUTHORIZED",
  "SUBMITTED",
] as const;

/**
 * cancelOpenPayouts
 *
 * Cancels open payout rows and appends PAYOUT_FAILED so ops cannot disperse
 * funds after cancel, chargeback, or ops refund.
 *
 * @param tx - Prisma transaction client.
 * @param orderId - Order UUID.
 * @param memo - Ledger memo / payout failureMessage.
 * @param failureCode - Stored on the payout row (default OPS_FREEZE).
 * @calledBy recordChargebackReceived, authorizeOpsRefund, authorizeCancelMoney
 */
export async function cancelOpenPayouts(
  tx: Prisma.TransactionClient,
  orderId: string,
  memo: string,
  failureCode = "OPS_FREEZE",
) {
  const open = await tx.payout.findMany({
    where: {
      orderId,
      status: { in: [...OPEN_PAYOUT_STATUSES] },
    },
  });

  for (const payout of open) {
    await tx.payout.update({
      where: { id: payout.id },
      data: {
        status: "CANCELLED",
        failureCode,
        failureMessage: memo,
      },
    });
    await appendLedgerEntry(tx, {
      orderId,
      payoutId: payout.id,
      type: "PAYOUT_FAILED",
      amountPesos: payout.amountPesos,
      currency: payout.currency,
      memo,
      metadata: { cancelledStatus: payout.status },
    });
  }
}
