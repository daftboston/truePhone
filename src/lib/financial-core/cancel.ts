/**
 * @file cancel.ts
 * @description Financial Core cancel/refund authorization (FINANCIAL_MODEL.md §5.2).
 * @dependencies fees, entitlements, ledger, payments resolve-provider, @/lib/db
 */

import { Prisma } from "@prisma/client";

import { buyerCancelRefundPesos } from "@/lib/financial-core/fees";
import {
  createLoyaltyEntitlementForSellerCancel,
  findActiveFeeEntitlement,
  markFeeEntitlementRefundChosen,
} from "@/lib/financial-core/entitlements";
import { appendLedgerEntry } from "@/lib/financial-core/ledger";
import { prisma } from "@/lib/db";
import { resolvePaymentProvider } from "@/lib/payments/resolve-provider";

/**
 * FinancialCoreError
 *
 * Domain error for cancel money authorization failures.
 */
class FinancialCoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinancialCoreError";
  }
}

export type CancelMoneyResult =
  | {
      ok: true;
      mode: "pre_payment" | "buyer_refund" | "seller_abandon_entitlement";
      refundPesos?: number;
      feeEntitlementId?: string;
    }
  | { ok: false; error: string };

/**
 * authorizeCancelMoney
 *
 * Financial Core cancel money rules (docs/FINANCIAL_MODEL.md §5.2).
 * - Buyer after pay: refund B − WompiCollection
 * - Seller after pay: no auto-refund; create 8% FeeEntitlement
 * - Pre-payment: mode pre_payment only
 *
 * @param input.orderId - Order UUID.
 * @param input.actorId - Buyer or seller profile UUID.
 * @param input.siteOrigin - Origin for payment provider resolution.
 * @param input.reason - Optional cancel/refund reason.
 * @returns CancelMoneyResult.
 * @calledBy cancelOrder / order cancel actions
 */
export async function authorizeCancelMoney(input: {
  orderId: string;
  actorId: string;
  siteOrigin: string;
  reason?: string | null;
}): Promise<CancelMoneyResult> {
  const order = await prisma.order.findFirst({ where: { id: input.orderId } });
  if (!order) {
    return { ok: false, error: "Pedido no encontrado." };
  }
  if (order.buyerId !== input.actorId && order.sellerId !== input.actorId) {
    return { ok: false, error: "No tienes acceso a este pedido." };
  }
  if (order.status !== "AWAITING_PAYMENT" && order.status !== "PAID") {
    return { ok: false, error: "Solo puedes cancelar un pedido activo." };
  }

  if (order.status === "AWAITING_PAYMENT") {
    return { ok: true, mode: "pre_payment" };
  }

  const isBuyer = order.buyerId === input.actorId;

  if (isBuyer) {
    const refundPesos = buyerCancelRefundPesos({
      buyerTotal: order.totalPrice,
      wompiCollectionPesos: order.wompiCollectionPesos,
    });

    const payment = await prisma.payment.findFirst({
      where: { orderId: order.id, status: "SUCCEEDED" },
      orderBy: { createdAt: "desc" },
    });
    if (!payment) {
      return { ok: false, error: "No hay un pago exitoso para reembolsar." };
    }

    const { provider } = resolvePaymentProvider(input.siteOrigin);
    if (payment.providerPaymentId) {
      const refund = await provider.refund({
        providerPaymentId: payment.providerPaymentId,
        amountPesos: refundPesos,
        reason: input.reason,
      });
      if (!refund.ok && payment.provider === "WOMPI") {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "REFUNDED",
              refundedAt: new Date(),
              refundAmount: refundPesos,
              failureMessage: `Reembolso manual requerido: ${refund.error}`,
            },
          });
          await appendLedgerEntry(tx, {
            orderId: order.id,
            paymentId: payment.id,
            type: "REFUND_APPROVED",
            amountPesos: refundPesos,
            currency: order.currency,
            memo: "Buyer cancel · absorbs Wompi collection fee",
            metadata: {
              wompiCollectionPesos: order.wompiCollectionPesos,
              providerNote: refund.error,
            },
          });
          await appendLedgerEntry(tx, {
            orderId: order.id,
            paymentId: payment.id,
            type: "REFUND_COMPLETED",
            amountPesos: refundPesos,
            currency: order.currency,
            memo: "Refund recorded (manual reconcile may be needed)",
          });
        });
        return { ok: true, mode: "buyer_refund", refundPesos };
      }
      if (!refund.ok) {
        return { ok: false, error: refund.error };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "REFUNDED",
          refundedAt: new Date(),
          refundAmount: refundPesos,
        },
      });
      await appendLedgerEntry(tx, {
        orderId: order.id,
        paymentId: payment.id,
        type: "REFUND_APPROVED",
        amountPesos: refundPesos,
        currency: order.currency,
        memo: "Buyer cancel · absorbs Wompi collection fee",
        metadata: { wompiCollectionPesos: order.wompiCollectionPesos },
      });
      await appendLedgerEntry(tx, {
        orderId: order.id,
        paymentId: payment.id,
        type: "REFUND_COMPLETED",
        amountPesos: refundPesos,
        currency: order.currency,
        memo: "Refund completed",
      });
    });

    return { ok: true, mode: "buyer_refund", refundPesos };
  }

  // Seller cancel / no-ship after payment — no auto-refund.
  try {
    const entitlement = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { sellerFulfillmentAbandonedAt: new Date() },
      });
      return createLoyaltyEntitlementForSellerCancel(tx, {
        buyerId: order.buyerId,
        sourceOrderId: order.id,
        sellerAmountPesos: order.sellerAmountPesos,
        currency: order.currency,
      });
    });

    return {
      ok: true,
      mode: "seller_abandon_entitlement",
      feeEntitlementId: entitlement.id,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await findActiveFeeEntitlement(order.buyerId);
      return {
        ok: true,
        mode: "seller_abandon_entitlement",
        feeEntitlementId: existing?.id,
      };
    }
    throw error;
  }
}

/**
 * authorizeRefundAfterSellerAbandon
 *
 * Buyer chooses full refund after seller abandon instead of loyalty purchase.
 *
 * @param input.orderId - Source order UUID.
 * @param input.buyerId - Buyer profile UUID.
 * @param input.siteOrigin - Origin for payment provider resolution.
 * @returns CancelMoneyResult with refund details or error.
 * @calledBy Buyer refund-choice actions
 */
export async function authorizeRefundAfterSellerAbandon(input: {
  orderId: string;
  buyerId: string;
  siteOrigin: string;
}): Promise<CancelMoneyResult> {
  const order = await prisma.order.findFirst({ where: { id: input.orderId } });
  if (!order) return { ok: false, error: "Pedido no encontrado." };
  if (order.buyerId !== input.buyerId) {
    return {
      ok: false,
      error: "Solo el comprador puede solicitar este reembolso.",
    };
  }

  const entitlement = await prisma.feeEntitlement.findUnique({
    where: { sourceOrderId: order.id },
  });
  if (!entitlement || entitlement.status !== "ACTIVE") {
    return {
      ok: false,
      error: "No hay una compensación activa para este pedido.",
    };
  }

  const payment = await prisma.payment.findFirst({
    where: { orderId: order.id, status: "SUCCEEDED" },
    orderBy: { createdAt: "desc" },
  });
  if (!payment) {
    return { ok: false, error: "No hay un pago exitoso para reembolsar." };
  }

  const refundPesos = order.totalPrice;
  const { provider } = resolvePaymentProvider(input.siteOrigin);
  if (payment.providerPaymentId) {
    const refund = await provider.refund({
      providerPaymentId: payment.providerPaymentId,
      amountPesos: refundPesos,
      reason: "Seller abandon · buyer chose refund",
    });
    if (!refund.ok && payment.provider !== "WOMPI") {
      return { ok: false, error: refund.error };
    }
  }

  await prisma.$transaction(async (tx) => {
    await markFeeEntitlementRefundChosen(tx, entitlement.id);
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
        refundAmount: refundPesos,
        failureMessage:
          payment.provider === "WOMPI" ? payment.failureMessage : null,
      },
    });
    await appendLedgerEntry(tx, {
      orderId: order.id,
      paymentId: payment.id,
      type: "REFUND_APPROVED",
      amountPesos: refundPesos,
      currency: order.currency,
      memo: "Buyer chose refund after seller abandon",
      metadata: { feeEntitlementId: entitlement.id },
    });
    await appendLedgerEntry(tx, {
      orderId: order.id,
      paymentId: payment.id,
      type: "REFUND_COMPLETED",
      amountPesos: refundPesos,
      currency: order.currency,
      memo: "Refund completed after seller abandon",
    });
  });

  return { ok: true, mode: "buyer_refund", refundPesos };
}

export { FinancialCoreError };
