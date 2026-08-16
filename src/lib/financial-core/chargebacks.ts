/**
 * @file chargebacks.ts
 * @description Financial Core chargeback ingestion and ops refund authorization
 * (FINANCIAL_MODEL.md §5.4 / §5.2b). TruePhone absorbs chargeback losses.
 * @dependencies fees, ledger, payments resolve-provider, @/lib/db
 */

import { Prisma } from "@prisma/client";

import { appendLedgerEntry } from "@/lib/financial-core/ledger";
import { prisma } from "@/lib/db";
import { resolvePaymentProvider } from "@/lib/payments/resolve-provider";

class FinancialCoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinancialCoreError";
  }
}

export type FinancialMoneyResult =
  | { ok: true; refundPesos?: number; alreadyRecorded?: boolean }
  | { ok: false; error: string };

export type ChargebackSource = "webhook" | "ops";

export type OpsRefundReason =
  | "PREMIUM_INSPECTION_FAILED"
  | "DISPUTE_BUYER_WIN"
  | "BATTERY_RETURN"
  | "CHARGEBACK_RECONCILE"
  | "MANUAL";

export type OpsListingOutcome = "republish" | "archive";

/**
 * cancelOpenPayouts
 *
 * Cancels AUTHORIZED / PENDING / SUBMITTED payouts so frozen money cannot disperse.
 *
 * @param tx - Prisma transaction client.
 * @param orderId - Order UUID.
 * @param memo - Ledger memo for each cancelled payout.
 * @calledBy recordChargebackReceived, authorizeOpsRefund
 */
async function cancelOpenPayouts(
  tx: Prisma.TransactionClient,
  orderId: string,
  memo: string,
) {
  const open = await tx.payout.findMany({
    where: {
      orderId,
      status: { in: ["PENDING", "AUTHORIZED", "SUBMITTED"] },
    },
  });

  for (const payout of open) {
    await tx.payout.update({
      where: { id: payout.id },
      data: {
        status: "CANCELLED",
        failureCode: "OPS_FREEZE",
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

/**
 * recordChargebackReceived
 *
 * Ingests a card chargeback / unexpected VOIDED after payment succeeded.
 * Freezes unsettled payouts; if the seller was already paid, TruePhone absorbs
 * the loss against Wompi Cuenta (ledger only).
 *
 * @param input.paymentId - Succeeded (or already refunded) payment UUID.
 * @param input.amountPesos - Chargeback amount in COP (defaults to payment.amount).
 * @param input.providerReference - Wompi transaction id when known.
 * @param input.source - webhook vs manual ops entry.
 * @param input.memo - Optional human memo.
 * @param input.actorProfileId - Ops actor when source is ops.
 * @returns FinancialMoneyResult; idempotent when CHARGEBACK_RECEIVED already exists.
 * @calledBy handleWompiWebhook, recordChargebackAction
 * @consumers Ops disputes queue
 */
export async function recordChargebackReceived(input: {
  paymentId: string;
  amountPesos?: number;
  providerReference?: string | null;
  source: ChargebackSource;
  memo?: string | null;
  actorProfileId?: string | null;
}): Promise<FinancialMoneyResult> {
  try {
    const payment = await prisma.payment.findFirst({
      where: { id: input.paymentId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            currency: true,
            sellerAmountPesos: true,
            payoutFrozen: true,
            payoutCompletedAt: true,
          },
        },
      },
    });
    if (!payment) {
      return { ok: false, error: "Pago no encontrado." };
    }
    if (payment.status !== "SUCCEEDED" && payment.status !== "REFUNDED") {
      return {
        ok: false,
        error:
          "Solo se registran contracargos sobre cobros exitosos o ya anulados.",
      };
    }

    // Idempotent: one CHARGEBACK_RECEIVED per payment.
    const existing = await prisma.ledgerEntry.findFirst({
      where: {
        orderId: payment.orderId,
        paymentId: payment.id,
        type: "CHARGEBACK_RECEIVED",
      },
    });
    if (existing) {
      return { ok: true, alreadyRecorded: true };
    }

    const amountPesos =
      input.amountPesos ?? payment.refundAmount ?? payment.amount;
    const providerReference =
      input.providerReference?.trim() || payment.providerPaymentId || null;
    const sellerAlreadyPaid = Boolean(payment.order.payoutCompletedAt);
    const memo =
      input.memo?.trim() ||
      (sellerAlreadyPaid
        ? "Chargeback received · seller already paid · TruePhone absorbs"
        : "Chargeback received · payout frozen");

    await prisma.$transaction(async (tx) => {
      await appendLedgerEntry(tx, {
        orderId: payment.orderId,
        paymentId: payment.id,
        type: "CHARGEBACK_RECEIVED",
        amountPesos,
        currency: payment.currency,
        memo,
        metadata: {
          source: input.source,
          providerReference,
          sellerAlreadyPaid,
          actorProfileId: input.actorProfileId ?? null,
        } satisfies Prisma.InputJsonValue,
      });

      // Provider already reversed collection — mirror on Payment when still SUCCEEDED.
      if (payment.status === "SUCCEEDED") {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "REFUNDED",
            refundedAt: new Date(),
            refundAmount: amountPesos,
            failureCode: "CHARGEBACK",
            failureMessage: "Contracargo / anulación del proveedor",
            providerPaymentId: providerReference ?? payment.providerPaymentId,
          },
        });
      }

      if (payment.order.status === "PAID" && !sellerAlreadyPaid) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { payoutFrozen: true },
        });
        await appendLedgerEntry(tx, {
          orderId: payment.orderId,
          paymentId: payment.id,
          type: "DISPUTE_OPENED",
          amountPesos: payment.order.sellerAmountPesos,
          currency: payment.currency,
          memo: "Payout frozen after chargeback",
        });
        await cancelOpenPayouts(
          tx,
          payment.orderId,
          "Payout cancelled after chargeback",
        );
      }
    });

    return { ok: true, refundPesos: amountPesos };
  } catch (error) {
    if (error instanceof FinancialCoreError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * authorizeOpsRefund
 *
 * Ops-authorized buyer refund for frozen / disputed orders (Premium fail,
 * dispute buyer win, battery return, chargeback reconcile). Never auto from UI alone.
 *
 * @param input.orderId - Order UUID (typically PAID + payoutFrozen).
 * @param input.actorProfileId - ADMIN who authorized.
 * @param input.siteOrigin - Origin for payment provider resolution.
 * @param input.reason - Locked policy reason code.
 * @param input.listingOutcome - republish (marketplace) or archive (Premium fail default).
 * @param input.notes - Optional ops notes for ledger.
 * @returns FinancialMoneyResult with refundPesos when ok.
 * @calledBy authorizeOpsRefundAction
 */
export async function authorizeOpsRefund(input: {
  orderId: string;
  actorProfileId: string;
  siteOrigin: string;
  reason: OpsRefundReason;
  listingOutcome?: OpsListingOutcome;
  notes?: string | null;
}): Promise<FinancialMoneyResult> {
  try {
    const order = await prisma.order.findFirst({
      where: { id: input.orderId },
      include: {
        listing: { select: { id: true, status: true } },
        payments: {
          where: { status: { in: ["SUCCEEDED", "REFUNDED"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    if (!order) {
      return { ok: false, error: "Pedido no encontrado." };
    }
    if (order.status !== "PAID" && order.status !== "CANCELLED") {
      return {
        ok: false,
        error:
          "Solo se reembolsan pedidos en custodia o ya cancelados pendientes de cierre.",
      };
    }
    if (order.payoutCompletedAt) {
      return {
        ok: false,
        error:
          "El vendedor ya fue liquidado. Registra el contracargo como absorbido; no uses reembolso de checkout.",
      };
    }

    const payment = order.payments[0];
    if (!payment) {
      return { ok: false, error: "No hay un cobro para reembolsar." };
    }

    const alreadyCompleted = await prisma.ledgerEntry.findFirst({
      where: { orderId: order.id, type: "REFUND_COMPLETED" },
    });
    if (alreadyCompleted) {
      return {
        ok: true,
        alreadyRecorded: true,
        refundPesos: payment.refundAmount ?? payment.amount,
      };
    }

    // Full eligible refund for ops dispute / Premium fail (FINANCIAL_MODEL §5.2b).
    const refundPesos = order.totalPrice;
    const listingOutcome =
      input.listingOutcome ??
      (input.reason === "PREMIUM_INSPECTION_FAILED" ? "archive" : "republish");

    // Attempt provider void when collection is still live.
    let providerNote: string | null = null;
    if (payment.status === "SUCCEEDED" && payment.providerPaymentId) {
      const { provider } = resolvePaymentProvider(input.siteOrigin);
      const refund = await provider.refund({
        providerPaymentId: payment.providerPaymentId,
        amountPesos: refundPesos,
        reason: input.reason,
      });
      if (!refund.ok) {
        providerNote = refund.error;
        // Wompi / manual: continue and flag for dashboard reconcile (same pattern as cancel.ts).
        if (payment.provider !== "WOMPI" && payment.provider !== "MOCK") {
          return { ok: false, error: refund.error };
        }
      }
    }

    const now = new Date();
    const memo = [
      `Ops refund · ${input.reason}`,
      input.notes?.trim() || null,
      providerNote ? `provider: ${providerNote}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    await prisma.$transaction(async (tx) => {
      await cancelOpenPayouts(tx, order.id, "Payout cancelled for ops refund");

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "REFUNDED",
          refundedAt: payment.refundedAt ?? now,
          refundAmount: refundPesos,
          failureMessage: providerNote
            ? `Reembolso manual requerido: ${providerNote}`
            : payment.failureMessage,
        },
      });

      await appendLedgerEntry(tx, {
        orderId: order.id,
        paymentId: payment.id,
        type: "REFUND_APPROVED",
        amountPesos: refundPesos,
        currency: order.currency,
        memo,
        metadata: {
          reason: input.reason,
          actorProfileId: input.actorProfileId,
          listingOutcome,
          providerNote,
        } satisfies Prisma.InputJsonValue,
      });

      await appendLedgerEntry(tx, {
        orderId: order.id,
        paymentId: payment.id,
        type: "REFUND_COMPLETED",
        amountPesos: refundPesos,
        currency: order.currency,
        memo: providerNote
          ? "Refund recorded (manual Wompi reconcile may be needed)"
          : "Ops refund completed",
      });

      await appendLedgerEntry(tx, {
        orderId: order.id,
        paymentId: payment.id,
        type: "DISPUTE_RESOLVED",
        amountPesos: order.sellerAmountPesos,
        currency: order.currency,
        memo: `Dispute resolved · buyer refund · ${input.reason}`,
        metadata: {
          actorProfileId: input.actorProfileId,
          outcome: "BUYER_REFUND",
        } satisfies Prisma.InputJsonValue,
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelledAt: order.cancelledAt ?? now,
          cancelledById: input.actorProfileId,
          cancelReason: input.notes?.trim() || input.reason,
          payoutFrozen: false,
        },
      });

      if (order.listing.status === "RESERVED") {
        await tx.listing.update({
          where: { id: order.listingId },
          data: {
            status: listingOutcome === "archive" ? "ARCHIVED" : "PUBLISHED",
          },
        });
      }
    });

    return { ok: true, refundPesos };
  } catch (error) {
    if (error instanceof FinancialCoreError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * resolveDisputeForSeller
 *
 * Clears payout freeze after ops decides the seller wins (device OK / claim denied).
 * Does not authorize payout by itself — confirm clock / cron still apply.
 *
 * @param input.orderId - Frozen PAID order.
 * @param input.actorProfileId - ADMIN actor.
 * @param input.memo - Resolution note.
 * @returns FinancialMoneyResult.
 * @calledBy resolveDisputeForSellerAction
 * @consumers unfreezePayout (inline ledger path)
 */
export async function resolveDisputeForSeller(input: {
  orderId: string;
  actorProfileId: string;
  memo?: string | null;
}): Promise<FinancialMoneyResult> {
  try {
    const order = await prisma.order.findFirst({
      where: { id: input.orderId },
    });
    if (!order) {
      return { ok: false, error: "Pedido no encontrado." };
    }
    if (order.status !== "PAID") {
      return { ok: false, error: "Solo se descongelan pedidos en custodia." };
    }
    if (order.payoutCompletedAt) {
      return { ok: false, error: "La liquidación ya se completó." };
    }

    // Block seller-win resolution after an unreconciled chargeback voided collection.
    const chargeback = await prisma.ledgerEntry.findFirst({
      where: { orderId: order.id, type: "CHARGEBACK_RECEIVED" },
      orderBy: { createdAt: "desc" },
    });
    if (chargeback) {
      const refundDone = await prisma.ledgerEntry.findFirst({
        where: { orderId: order.id, type: "REFUND_COMPLETED" },
      });
      if (!refundDone) {
        return {
          ok: false,
          error:
            "Hay un contracargo sin cerrar. Reembolsa / reconcilia o marca absorbido; no descongeles a favor del vendedor.",
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { payoutFrozen: false },
      });
      await appendLedgerEntry(tx, {
        orderId: order.id,
        type: "DISPUTE_RESOLVED",
        amountPesos: order.sellerAmountPesos,
        currency: order.currency,
        memo:
          input.memo?.trim() ||
          "Dispute resolved · seller wins · payout unfrozen",
        metadata: {
          actorProfileId: input.actorProfileId,
          outcome: "SELLER_WIN",
        } satisfies Prisma.InputJsonValue,
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
 * markChargebackAbsorbed
 *
 * Ops acknowledges TruePhone absorbs a chargeback after seller payout completed
 * (FINANCIAL_MODEL.md §5.4). Appends DISPUTE_RESOLVED for audit.
 *
 * @param input.orderId - COMPLETED order with CHARGEBACK_RECEIVED.
 * @param input.actorProfileId - ADMIN actor.
 * @param input.notes - Optional notes.
 * @returns FinancialMoneyResult.
 * @calledBy markChargebackAbsorbedAction
 */
export async function markChargebackAbsorbed(input: {
  orderId: string;
  actorProfileId: string;
  notes?: string | null;
}): Promise<FinancialMoneyResult> {
  try {
    const order = await prisma.order.findFirst({
      where: { id: input.orderId },
    });
    if (!order) {
      return { ok: false, error: "Pedido no encontrado." };
    }

    const chargeback = await prisma.ledgerEntry.findFirst({
      where: { orderId: order.id, type: "CHARGEBACK_RECEIVED" },
      orderBy: { createdAt: "desc" },
    });
    if (!chargeback) {
      return {
        ok: false,
        error: "No hay un contracargo registrado en este pedido.",
      };
    }

    const resolved = await prisma.ledgerEntry.findFirst({
      where: {
        orderId: order.id,
        type: "DISPUTE_RESOLVED",
        createdAt: { gt: chargeback.createdAt },
      },
    });
    if (resolved) {
      return { ok: true, alreadyRecorded: true };
    }

    await appendLedgerEntry(prisma, {
      orderId: order.id,
      paymentId: chargeback.paymentId,
      type: "DISPUTE_RESOLVED",
      amountPesos: chargeback.amountPesos,
      currency: order.currency,
      memo:
        input.notes?.trim() ||
        "Chargeback absorbed by TruePhone (Wompi Cuenta)",
      metadata: {
        actorProfileId: input.actorProfileId,
        outcome: "ABSORBED",
        chargebackLedgerId: chargeback.id,
      } satisfies Prisma.InputJsonValue,
    });

    if (order.payoutFrozen) {
      await prisma.order.update({
        where: { id: order.id },
        data: { payoutFrozen: false },
      });
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof FinancialCoreError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

export { FinancialCoreError };
