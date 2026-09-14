/**
 * @file entitlements.ts
 * @description Loyalty fee entitlement lifecycle after seller abandon / cancel.
 * @dependencies @prisma/client, @/lib/financial-core/fees, ledger, @/lib/db
 */

import type { Prisma } from "@prisma/client";

import {
  LOYALTY_FEE_RATE_BPS,
  type FeeRateKind,
} from "@/lib/financial-core/fees";
import { appendLedgerEntry } from "@/lib/financial-core/ledger";
import { prisma } from "@/lib/db";

type Tx = Prisma.TransactionClient;

/**
 * FeeEntitlementConflictError
 *
 * Thrown when an entitlement transition loses a race (not ACTIVE / not USED).
 */
export class FeeEntitlementConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeeEntitlementConflictError";
  }
}

/**
 * findActiveFeeEntitlement
 *
 * Finds the oldest ACTIVE, non-expired fee entitlement for a buyer.
 *
 * @param buyerId - Buyer profile UUID.
 * @param tx - Optional transaction client; defaults to prisma.
 * @returns FeeEntitlement or null.
 * @calledBy resolveFeeKindForBuyer
 */
export async function findActiveFeeEntitlement(buyerId: string, tx?: Tx) {
  const db = tx ?? prisma;
  return db.feeEntitlement.findFirst({
    where: {
      buyerId,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * findActiveFeeEntitlementForSource
 *
 * Validates that a compensation deep link belongs to the signed-in buyer and remains active.
 *
 * @param buyerId - Buyer profile UUID.
 * @param sourceOrderId - Cancelled source order from the deep link.
 * @param tx - Optional transaction client.
 * @returns Matching ACTIVE entitlement or null.
 * @calledBy explore, browse, and listing-detail compensation banners
 */
export async function findActiveFeeEntitlementForSource(
  buyerId: string,
  sourceOrderId: string,
  tx?: Tx,
) {
  const db = tx ?? prisma;
  return db.feeEntitlement.findFirst({
    where: {
      buyerId,
      sourceOrderId,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
}

/**
 * resolveFeeKindForBuyer
 *
 * Chooses default vs loyalty fee kind based on an active entitlement.
 *
 * @param buyerId - Buyer profile UUID.
 * @param tx - Optional transaction client.
 * @returns kind and entitlementId (null when using default).
 * @calledBy Order creation / checkout fee resolution
 */
export async function resolveFeeKindForBuyer(
  buyerId: string,
  tx?: Tx,
): Promise<{ kind: FeeRateKind; entitlementId: string | null }> {
  const entitlement = await findActiveFeeEntitlement(buyerId, tx);
  if (!entitlement) {
    return { kind: "default", entitlementId: null };
  }
  return { kind: "loyalty", entitlementId: entitlement.id };
}

/**
 * createLoyaltyEntitlementForSellerCancel
 *
 * After seller cancel / no-ship: create single-use 8% entitlement.
 * Does not refund — buyer must choose refund or replacement purchase.
 *
 * @param tx - Prisma transaction client.
 * @param input.buyerId - Buyer profile UUID.
 * @param input.sourceOrderId - Abandoned order UUID (unique source).
 * @param input.sellerAmountPesos - Held seller amount for ledger memo.
 * @param input.currency - Optional currency; defaults to COP.
 * @returns Existing or newly created FeeEntitlement.
 * @calledBy Cancel / seller abandon money paths
 */
export async function createLoyaltyEntitlementForSellerCancel(
  tx: Tx,
  input: {
    buyerId: string;
    sourceOrderId: string;
    sellerAmountPesos: number;
    currency?: string;
  },
) {
  const existing = await tx.feeEntitlement.findUnique({
    where: { sourceOrderId: input.sourceOrderId },
  });
  if (existing) return existing;

  const entitlement = await tx.feeEntitlement.create({
    data: {
      buyerId: input.buyerId,
      sourceOrderId: input.sourceOrderId,
      status: "ACTIVE",
      feeRateBps: LOYALTY_FEE_RATE_BPS,
    },
  });

  await appendLedgerEntry(tx, {
    orderId: input.sourceOrderId,
    type: "SELLER_FULFILLMENT_ABANDONED",
    amountPesos: input.sellerAmountPesos,
    currency: input.currency ?? "COP",
    memo: "Seller cancel / no-ship · loyalty 8% entitlement created (no auto-refund)",
    metadata: { feeEntitlementId: entitlement.id },
  });

  return entitlement;
}

/**
 * reserveFeeEntitlement
 *
 * Reserve entitlement on a replacement order (before payment).
 * Uses optimistic ACTIVE guard to prevent refund vs 8% races.
 *
 * @param tx - Prisma transaction client.
 * @param input.entitlementId - Fee entitlement UUID.
 * @param input.usedOnOrderId - Replacement order UUID.
 * @throws FeeEntitlementConflictError when entitlement is no longer ACTIVE.
 * @calledBy Order creation when applying loyalty rate
 */
export async function reserveFeeEntitlement(
  tx: Tx,
  input: { entitlementId: string; usedOnOrderId: string },
) {
  const reserved = await tx.feeEntitlement.updateMany({
    where: { id: input.entitlementId, status: "ACTIVE" },
    data: {
      status: "USED",
      usedAt: new Date(),
      usedOnOrderId: input.usedOnOrderId,
    },
  });
  if (reserved.count !== 1) {
    throw new FeeEntitlementConflictError(
      "La compensación del 8% ya no está disponible.",
    );
  }
}

/**
 * releaseFeeEntitlementForOrder
 *
 * Restore entitlement if the replacement order is cancelled before payment.
 *
 * @param tx - Prisma transaction client.
 * @param orderId - Order that had reserved the entitlement.
 * @returns Promise; no-op when no USED entitlement is linked.
 * @calledBy Pre-payment cancel paths
 */
export async function releaseFeeEntitlementForOrder(tx: Tx, orderId: string) {
  await tx.feeEntitlement.updateMany({
    where: { usedOnOrderId: orderId, status: "USED" },
    data: {
      status: "ACTIVE",
      usedAt: null,
      usedOnOrderId: null,
    },
  });
}

/**
 * markFeeEntitlementUsed
 *
 * @deprecated Prefer reserveFeeEntitlement
 *
 * @param tx - Prisma transaction client.
 * @param input - Entitlement id and used-on order id.
 * @returns Result of reserveFeeEntitlement.
 */
export async function markFeeEntitlementUsed(
  tx: Tx,
  input: { entitlementId: string; usedOnOrderId: string },
) {
  return reserveFeeEntitlement(tx, input);
}

/**
 * markFeeEntitlementRefundChosen
 *
 * Buyer chooses full refund instead of 8% loyalty purchase.
 * Uses optimistic ACTIVE guard to prevent concurrent replacement orders.
 *
 * @param tx - Prisma transaction client.
 * @param entitlementId - Fee entitlement UUID.
 * @returns true when entitlement was ACTIVE and is now REFUNDED.
 * @calledBy Buyer refund-choice after seller abandon
 */
export async function markFeeEntitlementRefundChosen(
  tx: Tx,
  entitlementId: string,
): Promise<boolean> {
  const updated = await tx.feeEntitlement.updateMany({
    where: { id: entitlementId, status: "ACTIVE" },
    data: {
      status: "REFUNDED",
      refundChosenAt: new Date(),
    },
  });
  return updated.count === 1;
}
