/**
 * @file ops-disputes.ts
 * @description Admin queries for frozen payouts, chargebacks, and manual refund queue.
 * @dependencies prisma
 */

import type { LedgerEntryType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

const disputeLedgerTypes: LedgerEntryType[] = [
  "DISPUTE_OPENED",
  "DISPUTE_RESOLVED",
  "CHARGEBACK_RECEIVED",
  "REFUND_APPROVED",
  "REFUND_COMPLETED",
];

const disputeOrderSelect = {
  id: true,
  status: true,
  currency: true,
  totalPrice: true,
  sellerAmountPesos: true,
  payoutFrozen: true,
  payoutCompletedAt: true,
  buyerConfirmDeadlineAt: true,
  cancelledAt: true,
  cancelReason: true,
  updatedAt: true,
  listing: { select: { id: true, title: true, slug: true, status: true } },
  buyer: {
    select: { id: true, fullName: true, username: true },
  },
  seller: {
    select: { id: true, fullName: true, username: true },
  },
  shipment: {
    select: {
      method: true,
      status: true,
      inspection: { select: { result: true } },
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      status: true,
      amount: true,
      refundAmount: true,
      refundedAt: true,
      failureMessage: true,
      failureCode: true,
      provider: true,
      providerPaymentId: true,
      reference: true,
    },
  },
  ledgerEntries: {
    where: { type: { in: disputeLedgerTypes } },
    orderBy: { createdAt: "desc" as const },
    take: 8,
    select: {
      id: true,
      type: true,
      amountPesos: true,
      memo: true,
      createdAt: true,
      paymentId: true,
    },
  },
} satisfies Prisma.OrderSelect;

export type OpsDisputeOrder = Awaited<
  ReturnType<typeof listOpsDisputeOrders>
>[number];

/**
 * unresolvedChargebackOrderIds
 *
 * Orders whose latest CHARGEBACK_RECEIVED has no later DISPUTE_RESOLVED.
 * Two queries (not N+1): chargebacks, then resolutions for those orders.
 *
 * @param take - Max chargeback ledger rows to scan (newest first).
 * @returns Distinct order ids still open for ops.
 * @calledBy countOpsDisputeQueue, listOpsDisputeOrders
 */
async function unresolvedChargebackOrderIds(take = 200) {
  const chargebacks = await prisma.ledgerEntry.findMany({
    where: { type: "CHARGEBACK_RECEIVED" },
    select: { orderId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take,
  });

  const latestByOrder = new Map<string, Date>();
  for (const row of chargebacks) {
    if (!latestByOrder.has(row.orderId)) {
      latestByOrder.set(row.orderId, row.createdAt);
    }
  }

  const orderIds = [...latestByOrder.keys()];
  if (orderIds.length === 0) return [];

  const resolved = await prisma.ledgerEntry.findMany({
    where: {
      orderId: { in: orderIds },
      type: "DISPUTE_RESOLVED",
    },
    select: { orderId: true, createdAt: true },
  });

  const latestResolved = new Map<string, Date>();
  for (const row of resolved) {
    const prev = latestResolved.get(row.orderId);
    if (!prev || row.createdAt > prev) {
      latestResolved.set(row.orderId, row.createdAt);
    }
  }

  const open: string[] = [];
  for (const [orderId, chargedAt] of latestByOrder) {
    const resolvedAt = latestResolved.get(orderId);
    if (!resolvedAt || resolvedAt <= chargedAt) {
      open.push(orderId);
    }
  }
  return open;
}

/**
 * countOpsDisputeQueue
 *
 * Counts unique open ops work: frozen PAID orders ∪ unresolved chargebacks.
 *
 * @returns Queue size for the review hub badge.
 * @calledBy ReviewHubPage, AdminDisputesPage
 */
export async function countOpsDisputeQueue() {
  const [frozen, chargebackIds] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PAID", payoutFrozen: true },
      select: { id: true },
    }),
    unresolvedChargebackOrderIds(),
  ]);
  return new Set([...frozen.map((row) => row.id), ...chargebackIds]).size;
}

/**
 * listOpsDisputeOrders
 *
 * Lists frozen PAID orders and completed orders with an open chargeback.
 *
 * @param limit - Max rows (default 50).
 * @returns Orders with payment + recent dispute ledger lines.
 * @calledBy AdminDisputesPage
 */
export async function listOpsDisputeOrders(limit = 50) {
  const [frozen, chargebackIds] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PAID", payoutFrozen: true },
      orderBy: { updatedAt: "asc" },
      take: limit,
      select: disputeOrderSelect,
    }),
    unresolvedChargebackOrderIds(100),
  ]);

  const frozenIds = new Set(frozen.map((o) => o.id));
  const extraIds = chargebackIds
    .filter((id) => !frozenIds.has(id))
    .slice(0, limit);

  const chargebackOrders =
    extraIds.length === 0
      ? []
      : await prisma.order.findMany({
          where: { id: { in: extraIds } },
          orderBy: { updatedAt: "desc" },
          select: disputeOrderSelect,
        });

  const merged = [...frozen, ...chargebackOrders];
  const seen = new Set<string>();
  return merged.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

/**
 * listManualRefundPayments
 *
 * Payments flagged for manual Wompi refund reconcile after provider void failed.
 *
 * @param limit - Max rows.
 * @returns Recent REFUNDED payments that still need dashboard action.
 * @calledBy AdminDisputesPage
 */
export async function listManualRefundPayments(limit = 30) {
  return prisma.payment.findMany({
    where: {
      status: "REFUNDED",
      failureMessage: { contains: "Reembolso manual requerido" },
    },
    orderBy: { refundedAt: "desc" },
    take: limit,
    select: {
      id: true,
      orderId: true,
      amount: true,
      refundAmount: true,
      currency: true,
      failureMessage: true,
      providerPaymentId: true,
      reference: true,
      refundedAt: true,
      order: {
        select: {
          id: true,
          listing: { select: { title: true } },
        },
      },
    },
  });
}

/**
 * classifyOpsDisputeCase
 *
 * Derives a Spanish label for the primary reason an order is in the ops queue.
 *
 * @param order - Dispute order payload.
 * @returns Short Spanish classification label.
 * @calledBy AdminDisputesPage
 */
export function classifyOpsDisputeCase(order: OpsDisputeOrder): {
  kind:
    | "chargeback"
    | "premium_fail"
    | "buyer_report"
    | "frozen"
    | "absorbed_pending";
  label: string;
} {
  const types = new Set(order.ledgerEntries.map((e) => e.type));
  const inspectionFailed = order.shipment?.inspection?.result === "FAILED";

  if (types.has("CHARGEBACK_RECEIVED")) {
    if (order.payoutCompletedAt) {
      return {
        kind: "absorbed_pending",
        label: "Contracargo (vendedor ya liquidado)",
      };
    }
    return { kind: "chargeback", label: "Contracargo" };
  }
  if (inspectionFailed) {
    return { kind: "premium_fail", label: "Inspección Premium fallida" };
  }
  if (types.has("DISPUTE_OPENED")) {
    return { kind: "buyer_report", label: "Reclamo del comprador" };
  }
  return { kind: "frozen", label: "Pago congelado" };
}

export type OpsDisputeKind = ReturnType<typeof classifyOpsDisputeCase>["kind"];

/**
 * defaultRefundReasonForKind
 *
 * Prefills the ops refund reason select from the classified case.
 *
 * @param kind - Classification from classifyOpsDisputeCase.
 * @returns Locked policy reason code.
 * @calledBy AdminDisputesPage
 */
export function defaultRefundReasonForKind(
  kind: OpsDisputeKind,
):
  | "PREMIUM_INSPECTION_FAILED"
  | "DISPUTE_BUYER_WIN"
  | "BATTERY_RETURN"
  | "CHARGEBACK_RECONCILE"
  | "MANUAL" {
  switch (kind) {
    case "premium_fail":
      return "PREMIUM_INSPECTION_FAILED";
    case "chargeback":
    case "absorbed_pending":
      return "CHARGEBACK_RECONCILE";
    case "buyer_report":
      return "DISPUTE_BUYER_WIN";
    default:
      return "MANUAL";
  }
}
