/**
 * @file order-support-queue.ts
 * @description Pure tab config and count tally for the staff order-support queue.
 * @dependencies @prisma/client
 */

import type { OrderSupportCaseStatus } from "@prisma/client";

export const ORDER_SUPPORT_QUEUE_TABS = {
  pendientes: {
    label: "Pendientes",
    statuses: ["PENDING"] as const,
  },
  revision: {
    label: "En revisión",
    statuses: ["IN_REVIEW"] as const,
  },
  vendedor: {
    label: "Esperando vendedor",
    statuses: ["NEEDS_SELLER_RESPONSE"] as const,
  },
  escaladas: {
    label: "Escaladas",
    statuses: ["ESCALATED"] as const,
  },
  resueltas: {
    label: "Resueltas",
    statuses: ["APPROVED", "REJECTED", "RESOLVED", "WITHDRAWN"] as const,
  },
} as const;

export type OrderSupportQueueTab = keyof typeof ORDER_SUPPORT_QUEUE_TABS;

export type OrderSupportQueueCounts = Record<OrderSupportQueueTab, number>;

export type OrderSupportStatusCountRow = {
  status: OrderSupportCaseStatus;
  count: number;
};

const STATUS_TO_TAB: Record<OrderSupportCaseStatus, OrderSupportQueueTab> = {
  PENDING: "pendientes",
  IN_REVIEW: "revision",
  NEEDS_SELLER_RESPONSE: "vendedor",
  ESCALATED: "escaladas",
  APPROVED: "resueltas",
  REJECTED: "resueltas",
  RESOLVED: "resueltas",
  WITHDRAWN: "resueltas",
};

/**
 * emptyOrderSupportQueueCounts
 *
 * Returns a zeroed tab tally.
 *
 * @returns Counts keyed by queue tab.
 * @calledBy tallyOrderSupportQueueCounts
 */
function emptyOrderSupportQueueCounts(): OrderSupportQueueCounts {
  return {
    pendientes: 0,
    revision: 0,
    vendedor: 0,
    escaladas: 0,
    resueltas: 0,
  };
}

/**
 * tallyOrderSupportQueueCounts
 *
 * Maps Prisma groupBy status rows into the five staff queue tabs.
 *
 * @param rows - Per-status counts from `orderSupportCase.groupBy`.
 * @returns Tab totals; unknown statuses are ignored via the enum map.
 * @calledBy countOrderSupportCasesForStaff
 *
 * @example
 * tallyOrderSupportQueueCounts([
 *   { status: "PENDING", count: 2 },
 *   { status: "APPROVED", count: 1 },
 * ]);
 * // { pendientes: 2, revision: 0, vendedor: 0, escaladas: 0, resueltas: 1 }
 */
export function tallyOrderSupportQueueCounts(
  rows: OrderSupportStatusCountRow[],
): OrderSupportQueueCounts {
  const counts = emptyOrderSupportQueueCounts();
  for (const row of rows) {
    counts[STATUS_TO_TAB[row.status]] += row.count;
  }
  return counts;
}

/**
 * parseOrderSupportQueueTab
 *
 * Resolves a supported query tab and falls back to pending work.
 *
 * @param value - Raw `tab` query value.
 * @returns Valid queue tab key.
 * @calledBy OrderSupportQueuePage
 */
export function parseOrderSupportQueueTab(
  value: string | undefined,
): OrderSupportQueueTab {
  return value && value in ORDER_SUPPORT_QUEUE_TABS
    ? (value as OrderSupportQueueTab)
    : "pendientes";
}
