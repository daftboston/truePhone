/**
 * @file settlement.ts
 * @description Financial Core settlement: buyer receipt starts the 24h confirm
 * window, early confirm / report, and seller payout authorization.
 * @dependencies prisma, ledger, payout provider adapter
 */

import { Prisma } from "@prisma/client";

import { appendLedgerEntry } from "@/lib/financial-core/ledger";
import { prisma } from "@/lib/db";
import { resolvePayoutProvider } from "@/lib/payments/payouts/resolve-provider";

/** Buyer confirm / report window after they mark the device received. */
const BUYER_CONFIRM_WINDOW_MS = 24 * 60 * 60 * 1000;

class FinancialCoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinancialCoreError";
  }
}

export type FinancialResult = { ok: true } | { ok: false; error: string };

/**
 * isShipmentReadyForBuyerReceipt
 *
 * Returns true when the shipment is far enough along for the buyer to ack receipt.
 * Carrier: tracking uploaded. Premium: inspection passed or already in transit.
 */
function isShipmentReadyForBuyerReceipt(shipment: {
  method: string;
  status: string;
  trackingCode: string | null;
  inspection: { result: string } | null;
}): boolean {
  if (shipment.status === "FAILED" || shipment.status === "RETURNED") {
    return false;
  }
  if (shipment.method === "CARRIER") {
    return Boolean(shipment.trackingCode);
  }
  if (shipment.method === "PREMIUM_BOGOTA") {
    return (
      shipment.inspection?.result === "PASSED" ||
      shipment.status === "IN_TRANSIT" ||
      shipment.status === "DELIVERED"
    );
  }
  return false;
}

/**
 * onBuyerMarkedReceived
 *
 * Buyer marks that they physically received the iPhone.
 * Sets Shipment.deliveredAt (buyer receipt ack) and starts the 24h confirm window.
 * Idempotent if buyerConfirmDeadlineAt is already set.
 *
 * @param input.orderId - Order to update
 * @param input.buyerId - Must be the order buyer
 * @returns FinancialResult
 */
export async function onBuyerMarkedReceived(input: {
  orderId: string;
  buyerId: string;
}): Promise<FinancialResult> {
  const receivedAt = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: input.orderId },
        include: {
          shipment: { include: { inspection: true } },
        },
      });
      if (!order) throw new FinancialCoreError("Pedido no encontrado.");
      if (order.buyerId !== input.buyerId) {
        throw new FinancialCoreError(
          "Solo el comprador puede confirmar que recibió el iPhone.",
        );
      }
      if (order.status !== "PAID") {
        throw new FinancialCoreError(
          "Solo pedidos con pago en custodia pueden marcarse como recibidos.",
        );
      }
      if (order.buyerConfirmDeadlineAt) {
        return;
      }

      const shipment = order.shipment;
      if (!shipment) {
        throw new FinancialCoreError(
          "Aún no hay envío registrado para este pedido.",
        );
      }
      if (!isShipmentReadyForBuyerReceipt(shipment)) {
        throw new FinancialCoreError(
          shipment.method === "CARRIER"
            ? "Espera a que el vendedor suba el código de seguimiento."
            : "Espera a que TruePhone complete la inspección y el envío Premium.",
        );
      }

      const deadline = new Date(receivedAt.getTime() + BUYER_CONFIRM_WINDOW_MS);

      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: "DELIVERED",
          deliveredAt: shipment.deliveredAt ?? receivedAt,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { buyerConfirmDeadlineAt: deadline },
      });
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof FinancialCoreError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * confirmOrderByBuyer
 *
 * Buyer confirms the device matches the listing → authorize payout path.
 *
 * @param input.orderId - Order id
 * @param input.buyerId - Must be the order buyer
 * @returns FinancialResult; on success triggers payout authorization
 */
export async function confirmOrderByBuyer(input: {
  orderId: string;
  buyerId: string;
}): Promise<FinancialResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id: input.orderId } });
      if (!order) throw new FinancialCoreError("Pedido no encontrado.");
      if (order.buyerId !== input.buyerId) {
        throw new FinancialCoreError(
          "Solo el comprador puede confirmar este pedido.",
        );
      }
      if (order.status !== "PAID") {
        throw new FinancialCoreError("Este pedido no está en custodia.");
      }
      if (order.payoutFrozen) {
        throw new FinancialCoreError(
          "Hay una disputa abierta; el pago está congelado.",
        );
      }
      if (!order.buyerConfirmDeadlineAt) {
        throw new FinancialCoreError(
          "Primero confirma que recibiste el iPhone (Ya recibí el iPhone).",
        );
      }
      if (order.buyerConfirmedAt) return;

      const now = new Date();
      await tx.order.update({
        where: { id: order.id },
        data: { buyerConfirmedAt: now },
      });
      await appendLedgerEntry(tx, {
        orderId: order.id,
        type: "BUYER_CONFIRMED",
        amountPesos: order.sellerAmountPesos,
        currency: order.currency,
        memo: "Buyer confirmed device matches listing",
      });
    });

    return authorizeAndSubmitPayout({ orderId: input.orderId });
  } catch (error) {
    if (error instanceof FinancialCoreError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * freezePayout
 *
 * Freeze payout (dispute / chargeback / problem report).
 *
 * @param input.orderId - Order whose payout to freeze
 * @param input.reason - Human-readable freeze reason (ledger memo)
 */
export async function freezePayout(input: {
  orderId: string;
  reason: string;
}): Promise<FinancialResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id: input.orderId } });
      if (!order) throw new FinancialCoreError("Pedido no encontrado.");
      if (order.status !== "PAID") {
        throw new FinancialCoreError(
          "No hay fondos en custodia para congelar.",
        );
      }
      await tx.order.update({
        where: { id: order.id },
        data: { payoutFrozen: true },
      });
      await appendLedgerEntry(tx, {
        orderId: order.id,
        type: "DISPUTE_OPENED",
        amountPesos: order.sellerAmountPesos,
        memo: input.reason,
      });
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof FinancialCoreError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * unfreezePayout
 *
 * Clears payout freeze after dispute resolution (ops).
 */
export async function unfreezePayout(input: {
  orderId: string;
  memo?: string;
}): Promise<FinancialResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id: input.orderId } });
      if (!order) throw new FinancialCoreError("Pedido no encontrado.");
      await tx.order.update({
        where: { id: order.id },
        data: { payoutFrozen: false },
      });
      await appendLedgerEntry(tx, {
        orderId: order.id,
        type: "DISPUTE_RESOLVED",
        amountPesos: order.sellerAmountPesos,
        memo: input.memo ?? "Dispute resolved · payout unfrozen",
      });
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof FinancialCoreError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

function isPayoutEligible(
  order: {
    status: string;
    fundsHeldAt: Date | null;
    payoutFrozen: boolean;
    buyerConfirmedAt: Date | null;
    buyerConfirmDeadlineAt: Date | null;
    payoutCompletedAt: Date | null;
  },
  now = new Date(),
) {
  if (order.status !== "PAID") return false;
  if (!order.fundsHeldAt) return false;
  if (order.payoutFrozen) return false;
  if (order.payoutCompletedAt) return false;
  if (order.buyerConfirmedAt) return true;
  if (
    order.buyerConfirmDeadlineAt &&
    order.buyerConfirmDeadlineAt.getTime() <= now.getTime()
  ) {
    return true;
  }
  return false;
}

/**
 * authorizeAndSubmitPayout
 *
 * Authorize + submit seller payout when confirm/24h rules are met.
 * Marketplace/Shipping must not call provider APIs directly.
 */
export async function authorizeAndSubmitPayout(input: {
  orderId: string;
}): Promise<FinancialResult> {
  const { provider, mode } = resolvePayoutProvider();

  try {
    const prepared = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: input.orderId },
        include: {
          seller: {
            include: {
              sellerBankAccounts: {
                where: { isDefault: true },
                take: 1,
              },
            },
          },
        },
      });
      if (!order) throw new FinancialCoreError("Pedido no encontrado.");

      const now = new Date();
      if (!isPayoutEligible(order, now)) {
        throw new FinancialCoreError(
          "Aún no se puede autorizar el pago al vendedor (falta recepción/confirmación o hay un congelamiento).",
        );
      }

      const expiredWithoutConfirm =
        !order.buyerConfirmedAt &&
        order.buyerConfirmDeadlineAt &&
        order.buyerConfirmDeadlineAt.getTime() <= now.getTime();

      if (expiredWithoutConfirm) {
        await appendLedgerEntry(tx, {
          orderId: order.id,
          type: "BUYER_CONFIRM_EXPIRED",
          amountPesos: order.sellerAmountPesos,
          currency: order.currency,
          memo: "24h window elapsed without buyer report · auto-release",
        });
      }

      const existing = await tx.payout.findFirst({
        where: {
          orderId: order.id,
          status: { in: ["AUTHORIZED", "SUBMITTED", "COMPLETED"] },
        },
      });
      if (existing?.status === "COMPLETED") {
        return null;
      }
      if (existing) {
        return {
          payoutId: existing.id,
          order,
          bank: order.seller.sellerBankAccounts[0] ?? null,
        };
      }

      const idempotencyKey = `payout_${order.id}`;
      const payout = await tx.payout.create({
        data: {
          orderId: order.id,
          sellerId: order.sellerId,
          sellerBankAccountId: order.seller.sellerBankAccounts[0]?.id ?? null,
          provider: mode,
          status: "AUTHORIZED",
          amountPesos: order.sellerAmountPesos,
          currency: order.currency,
          idempotencyKey,
          authorizedAt: now,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { payoutAuthorizedAt: now },
      });

      await appendLedgerEntry(tx, {
        orderId: order.id,
        payoutId: payout.id,
        type: "PAYOUT_AUTHORIZED",
        amountPesos: order.sellerAmountPesos,
        currency: order.currency,
        memo: "Financial Core authorized seller payout",
      });

      return {
        payoutId: payout.id,
        order,
        bank: order.seller.sellerBankAccounts[0] ?? null,
      };
    });

    if (!prepared) return { ok: true };

    const destination = prepared.bank
      ? {
          legalIdType: prepared.bank.legalIdType,
          legalId: prepared.bank.legalId,
          bankCode: prepared.bank.bankCode,
          accountType: prepared.bank.accountType,
          accountNumber: prepared.bank.accountNumber,
          holderName: prepared.bank.holderName,
          email: prepared.bank.email,
        }
      : {
          // Mock path allows missing bank details; Wompi stub will refuse.
          legalIdType: "CC",
          legalId: "0000000000",
          bankCode: "000",
          accountType: "AHORROS" as const,
          accountNumber: "0000000000",
          holderName: "Pending bank details",
          email: "payouts@truephone.local",
        };

    const result = await provider.createPayout({
      idempotencyKey: `payout_${prepared.order.id}`,
      amountPesos: prepared.order.sellerAmountPesos,
      currency: prepared.order.currency,
      reference: prepared.order.id,
      destination,
    });

    if (!result.ok) {
      await prisma.$transaction(async (tx) => {
        await tx.payout.update({
          where: { id: prepared.payoutId },
          data: {
            status: "FAILED",
            failureCode: result.failureCode ?? "PROVIDER_ERROR",
            failureMessage: result.error,
          },
        });
        await appendLedgerEntry(tx, {
          orderId: prepared.order.id,
          payoutId: prepared.payoutId,
          type: "PAYOUT_FAILED",
          amountPesos: prepared.order.sellerAmountPesos,
          memo: result.error,
        });
      });
      return { ok: false, error: result.error };
    }

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      const approved = result.status === "APPROVED";

      await tx.payout.update({
        where: { id: prepared.payoutId },
        data: {
          status: approved ? "COMPLETED" : "SUBMITTED",
          providerPayoutId: result.providerPayoutId,
          providerLoteId: result.providerLoteId ?? null,
          submittedAt: now,
          completedAt: approved ? now : null,
          failureCode: null,
          failureMessage: null,
        },
      });

      await appendLedgerEntry(tx, {
        orderId: prepared.order.id,
        payoutId: prepared.payoutId,
        type: "PAYOUT_SUBMITTED",
        amountPesos: prepared.order.sellerAmountPesos,
        memo: `Submitted via ${mode}`,
        metadata: {
          providerPayoutId: result.providerPayoutId,
          providerStatus: result.status,
        } satisfies Prisma.InputJsonValue,
      });

      if (approved) {
        await markOrderCompletedAfterPayout(tx, {
          orderId: prepared.order.id,
          sellerId: prepared.order.sellerId,
          listingId: prepared.order.listingId,
          payoutId: prepared.payoutId,
          sellerAmountPesos: prepared.order.sellerAmountPesos,
          currency: prepared.order.currency,
        });
      }
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof FinancialCoreError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * processExpiredBuyerConfirmations
 *
 * Process orders whose 24h confirm window expired (cron / ops).
 */
export async function processExpiredBuyerConfirmations(limit = 50) {
  const now = new Date();
  const due = await prisma.order.findMany({
    where: {
      status: "PAID",
      payoutFrozen: false,
      buyerConfirmedAt: null,
      payoutCompletedAt: null,
      buyerConfirmDeadlineAt: { lte: now },
      fundsHeldAt: { not: null },
    },
    select: { id: true },
    take: limit,
  });

  const results: { orderId: string; ok: boolean; error?: string }[] = [];
  for (const row of due) {
    const result = await authorizeAndSubmitPayout({ orderId: row.id });
    results.push({
      orderId: row.id,
      ok: result.ok,
      error: result.ok ? undefined : result.error,
    });
  }
  return results;
}

async function markOrderCompletedAfterPayout(
  tx: Prisma.TransactionClient,
  input: {
    orderId: string;
    sellerId: string;
    listingId: string;
    payoutId: string;
    sellerAmountPesos: number;
    currency: string;
  },
) {
  const now = new Date();
  await tx.order.update({
    where: { id: input.orderId },
    data: {
      status: "COMPLETED",
      completedAt: now,
      payoutCompletedAt: now,
    },
  });

  await tx.listing.updateMany({
    where: { id: input.listingId, status: "RESERVED" },
    data: { status: "SOLD" },
  });

  await tx.profile.update({
    where: { id: input.sellerId },
    data: { totalSales: { increment: 1 } },
  });

  await appendLedgerEntry(tx, {
    orderId: input.orderId,
    payoutId: input.payoutId,
    type: "PAYOUT_COMPLETED",
    amountPesos: input.sellerAmountPesos,
    currency: input.currency,
    memo: "Seller bank credited · order completed",
  });
}

export { FinancialCoreError, BUYER_CONFIRM_WINDOW_MS };
