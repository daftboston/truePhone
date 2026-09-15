/**
 * @file pqr-queue.ts
 * @description Tab config and count tally for the staff PQR queue.
 * @dependencies @prisma/client
 */

import type { PqrCaseStatus } from "@prisma/client";

export const PQR_QUEUE_TABS = {
  pendientes: {
    label: "Pendientes",
    statuses: ["PENDING"] as const,
  },
  revision: {
    label: "En revisión",
    statuses: ["IN_REVIEW"] as const,
  },
  respondidos: {
    label: "Respondidos",
    statuses: ["RESPONDED"] as const,
  },
  cerrados: {
    label: "Cerrados",
    statuses: ["CLOSED"] as const,
  },
} as const;

export type PqrQueueTab = keyof typeof PQR_QUEUE_TABS;

export type PqrQueueCounts = Record<PqrQueueTab, number>;

export type PqrStatusCountRow = {
  status: PqrCaseStatus;
  count: number;
};

const STATUS_TO_TAB: Record<PqrCaseStatus, PqrQueueTab> = {
  PENDING: "pendientes",
  IN_REVIEW: "revision",
  RESPONDED: "respondidos",
  CLOSED: "cerrados",
};

/**
 * emptyPqrQueueCounts
 *
 * Returns a zeroed tab tally.
 *
 * @returns Counts keyed by queue tab.
 * @calledBy tallyPqrQueueCounts
 */
function emptyPqrQueueCounts(): PqrQueueCounts {
  return {
    pendientes: 0,
    revision: 0,
    respondidos: 0,
    cerrados: 0,
  };
}

/**
 * tallyPqrQueueCounts
 *
 * Maps Prisma groupBy status rows into staff queue tabs.
 *
 * @param rows - Per-status counts from `pqrCase.groupBy`.
 * @returns Tab totals.
 * @calledBy countPqrCasesForStaff
 */
export function tallyPqrQueueCounts(rows: PqrStatusCountRow[]): PqrQueueCounts {
  const counts = emptyPqrQueueCounts();
  for (const row of rows) {
    counts[STATUS_TO_TAB[row.status]] += row.count;
  }
  return counts;
}

/**
 * parsePqrQueueTab
 *
 * Resolves a supported query tab and falls back to pending work.
 *
 * @param value - Raw `tab` query value.
 * @returns Valid queue tab key.
 * @calledBy PqrQueuePage
 */
export function parsePqrQueueTab(value: string | undefined): PqrQueueTab {
  return value && value in PQR_QUEUE_TABS
    ? (value as PqrQueueTab)
    : "pendientes";
}
