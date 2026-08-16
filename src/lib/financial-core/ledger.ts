/**
 * @file ledger.ts
 * @description Append-only order ledger writes and reads (FINANCIAL_MODEL.md).
 * @dependencies @prisma/client, @/lib/db
 */

import {
  Prisma,
  type LedgerEntryType,
  type PrismaClient,
} from "@prisma/client";

type Tx = Prisma.TransactionClient | PrismaClient;

export type AppendLedgerInput = {
  orderId: string;
  type: LedgerEntryType;
  amountPesos: number;
  currency?: string;
  paymentId?: string | null;
  payoutId?: string | null;
  memo?: string | null;
  metadata?: Prisma.InputJsonValue;
};

/**
 * appendLedgerEntry
 *
 * Append-only ledger write. Never update or delete entries.
 *
 * @param tx - Prisma client or interactive transaction client.
 * @param input - Order id, entry type, amount, and optional links/memo.
 * @returns Created LedgerEntry row.
 * @calledBy hold, cancel, settlement, payment confirmation paths
 */
export async function appendLedgerEntry(tx: Tx, input: AppendLedgerInput) {
  return tx.ledgerEntry.create({
    data: {
      orderId: input.orderId,
      type: input.type,
      amountPesos: input.amountPesos,
      currency: input.currency ?? "COP",
      paymentId: input.paymentId ?? null,
      payoutId: input.payoutId ?? null,
      memo: input.memo ?? null,
      metadata: input.metadata,
    },
  });
}

/**
 * listLedgerForOrder
 *
 * Lists ledger entries for an order in creation order.
 *
 * @param orderId - Order UUID.
 * @param tx - Optional transaction/client; defaults to shared prisma.
 * @returns LedgerEntry rows ascending by createdAt.
 * @calledBy Admin/debug and financial reconciliation helpers
 */
export async function listLedgerForOrder(orderId: string, tx?: Tx) {
  const db = tx ?? (await import("@/lib/db")).prisma;
  return db.ledgerEntry.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });
}
