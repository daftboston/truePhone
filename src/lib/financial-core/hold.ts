/**
 * @file hold.ts
 * @description Records payment approval and seller fund hold ledger entries after checkout success.
 * @dependencies @prisma/client, @/lib/financial-core/ledger
 */

import type { Prisma } from "@prisma/client";

import { appendLedgerEntry } from "@/lib/financial-core/ledger";

type Tx = Prisma.TransactionClient;

/**
 * recordPaymentHold
 *
 * Records PaymentApproved + hold. Seller is NOT paid.
 * Caller must already have flipped Payment → SUCCEEDED and Order → PAID.
 *
 * @param tx - Prisma interactive transaction client.
 * @param input.orderId - Order UUID.
 * @param input.paymentId - Payment UUID.
 * @param input.buyerTotal - Total charged to buyer (COP).
 * @param input.sellerAmountPesos - Seller share held until payout.
 * @param input.platformFee - Marketplace fee pool.
 * @param input.wompiCollectionPesos - Wompi collection fee with IVA.
 * @param input.wompiPayoutPesos - Estimated Wompi payout fee with IVA.
 * @param input.truephoneRevenuePesos - Platform net after Wompi fees.
 * @param input.feeRateBps - Fee rate in basis points snapshot.
 * @param input.currency - Currency code; defaults to COP.
 * @returns Promise that resolves when order fundsHeldAt and ledger rows are written.
 * @calledBy Payment confirmation / webhook success paths
 */
export async function recordPaymentHold(
  tx: Tx,
  input: {
    orderId: string;
    paymentId: string;
    buyerTotal: number;
    sellerAmountPesos: number;
    platformFee: number;
    wompiCollectionPesos: number;
    wompiPayoutPesos: number;
    truephoneRevenuePesos: number;
    feeRateBps: number;
    currency?: string;
  },
) {
  const currency = input.currency ?? "COP";
  const now = new Date();

  await tx.order.update({
    where: { id: input.orderId },
    data: { fundsHeldAt: now },
  });

  await appendLedgerEntry(tx, {
    orderId: input.orderId,
    paymentId: input.paymentId,
    type: "PAYMENT_APPROVED",
    amountPesos: input.buyerTotal,
    currency,
    memo: "Buyer payment approved · funds toward Wompi Cuenta",
    metadata: {
      feeRateBps: input.feeRateBps,
      platformFee: input.platformFee,
    },
  });

  await appendLedgerEntry(tx, {
    orderId: input.orderId,
    paymentId: input.paymentId,
    type: "HOLD_CREATED",
    amountPesos: input.sellerAmountPesos,
    currency,
    memo: "Seller amount held · not payable until buyer receipt + confirm/24h + payout",
  });

  await appendLedgerEntry(tx, {
    orderId: input.orderId,
    paymentId: input.paymentId,
    type: "FEE_SNAPSHOT",
    amountPesos: input.platformFee,
    currency,
    memo: "Marketplace fee pool snapshot",
    metadata: {
      feeRateBps: input.feeRateBps,
      wompiCollectionPesos: input.wompiCollectionPesos,
      wompiPayoutPesos: input.wompiPayoutPesos,
      truephoneRevenuePesos: input.truephoneRevenuePesos,
    },
  });
}
