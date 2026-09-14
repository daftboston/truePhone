/**
 * @file pqr-service.ts
 * @description Persists consumer PQR cases with readable radicado ids.
 * @dependencies @prisma/client, prisma, pqr-queue
 * @changelog 2026-09-14 — Initial PQR channel for retracto + Ley 2439/2024.
 */

import { randomBytes } from "node:crypto";

import { type PqrCaseStatus, type PqrCaseType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { pqrTipoLabel } from "@/lib/pqr/pqr-labels";
import { tallyPqrQueueCounts } from "@/lib/pqr/pqr-queue";

export { pqrStatusLabel, pqrTipoLabel } from "@/lib/pqr/pqr-labels";

export const ACTIVE_PQR_STATUSES: PqrCaseStatus[] = ["PENDING", "IN_REVIEW"];

/**
 * generatePqrRadicado
 *
 * Builds a human-readable, date-stamped radicado id.
 *
 * @returns Unique radicado string (e.g. PQR-20260914-A1B2C3).
 * @calledBy createPqrCase
 */
export function generatePqrRadicado(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `PQR-${date}-${suffix}`;
}

const staffCaseInclude = {
  user: {
    select: { id: true, fullName: true, username: true, role: true },
  },
  order: {
    select: {
      id: true,
      status: true,
      totalPrice: true,
      currency: true,
      listing: { select: { title: true } },
    },
  },
  assignedStaff: {
    select: { id: true, fullName: true, username: true, role: true },
  },
  respondedBy: {
    select: { id: true, fullName: true, username: true, role: true },
  },
} satisfies Prisma.PqrCaseInclude;

export type StaffPqrCase = Prisma.PqrCaseGetPayload<{
  include: typeof staffCaseInclude;
}>;

type PqrServiceResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type CreatePqrCaseInput = {
  tipo: PqrCaseType;
  fullName: string;
  email: string;
  body: string;
  orderId?: string | null;
  userId?: string | null;
  attachments?: Prisma.InputJsonValue | null;
};

/**
 * createPqrCase
 *
 * Persists a new PQR case with a unique radicado id.
 *
 * @param input - Validated consumer submission.
 * @returns Created case row or error.
 * @calledBy createPqrCaseAction
 */
export async function createPqrCase(
  input: CreatePqrCaseInput,
): Promise<PqrServiceResult<StaffPqrCase>> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const radicado = generatePqrRadicado();
    try {
      const created = await prisma.pqrCase.create({
        data: {
          radicado,
          tipo: input.tipo,
          fullName: input.fullName,
          email: input.email,
          body: input.body,
          orderId: input.orderId || null,
          userId: input.userId || null,
          attachments: input.attachments ?? undefined,
        },
        include: staffCaseInclude,
      });
      return { ok: true, data: created };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  return {
    ok: false,
    error: "No pudimos generar un radicado. Intenta de nuevo.",
  };
}

/**
 * listPqrCasesForStaff
 *
 * Lists PQR cases filtered by queue tab statuses.
 *
 * @param statuses - Status filter from queue tab.
 * @returns Cases ordered newest first.
 * @calledBy PqrQueuePage
 */
export async function listPqrCasesForStaff(statuses: readonly PqrCaseStatus[]) {
  return prisma.pqrCase.findMany({
    where: { status: { in: [...statuses] } },
    include: staffCaseInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/**
 * countPqrCasesForStaff
 *
 * Tallies PQR cases per queue tab for badges.
 *
 * @returns Tab counts keyed by queue id.
 * @calledBy PqrQueuePage, revision hub
 */
export async function countPqrCasesForStaff() {
  const rows = await prisma.pqrCase.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return tallyPqrQueueCounts(
    rows.map((row) => ({ status: row.status, count: row._count._all })),
  );
}

/**
 * countActionablePqrCases
 *
 * Returns pending + in-review PQR count for the revision hub.
 *
 * @returns Open PQR workload size.
 * @calledBy ReviewHubPage
 */
export async function countActionablePqrCases() {
  return prisma.pqrCase.count({
    where: { status: { in: ACTIVE_PQR_STATUSES } },
  });
}

/**
 * getPqrCaseForStaff
 *
 * Loads one PQR case with relations for the ops detail page.
 *
 * @param caseId - PqrCase cuid.
 * @returns Case detail or null.
 * @calledBy PqrCasePage
 */
export async function getPqrCaseForStaff(caseId: string) {
  return prisma.pqrCase.findUnique({
    where: { id: caseId },
    include: staffCaseInclude,
  });
}

/**
 * claimPqrCase
 *
 * Assigns a pending PQR case to the current staff member.
 *
 * @param caseId - PqrCase cuid.
 * @param staffId - Reviewer/admin profile id.
 * @returns Updated case or error.
 * @calledBy claimPqrCaseAction
 */
export async function claimPqrCase(
  caseId: string,
  staffId: string,
): Promise<PqrServiceResult<StaffPqrCase>> {
  const existing = await prisma.pqrCase.findUnique({ where: { id: caseId } });
  if (!existing) return { ok: false, error: "Caso no encontrado." };
  if (existing.status !== "PENDING" && existing.status !== "IN_REVIEW") {
    return { ok: false, error: "Este caso ya no admite asignación." };
  }
  if (existing.assignedStaffId && existing.assignedStaffId !== staffId) {
    return { ok: false, error: "Este caso ya está asignado a otro revisor." };
  }

  const updated = await prisma.pqrCase.update({
    where: { id: caseId },
    data: {
      assignedStaffId: staffId,
      status: "IN_REVIEW",
    },
    include: staffCaseInclude,
  });

  return { ok: true, data: updated };
}

/**
 * respondToPqrCase
 *
 * Persists a formal staff response and marks the case responded.
 *
 * @param caseId - PqrCase cuid.
 * @param staffId - Responding reviewer/admin id.
 * @param respuesta - Published response text.
 * @returns Updated case or error.
 * @calledBy staffRespondPqrCaseAction
 */
export async function respondToPqrCase(
  caseId: string,
  staffId: string,
  respuesta: string,
): Promise<PqrServiceResult<StaffPqrCase>> {
  const existing = await prisma.pqrCase.findUnique({ where: { id: caseId } });
  if (!existing) return { ok: false, error: "Caso no encontrado." };
  if (existing.status === "CLOSED") {
    return { ok: false, error: "Este caso ya está cerrado." };
  }

  const now = new Date();
  const updated = await prisma.pqrCase.update({
    where: { id: caseId },
    data: {
      respuesta,
      respondedAt: now,
      respondedById: staffId,
      assignedStaffId: existing.assignedStaffId ?? staffId,
      status: "RESPONDED",
    },
    include: staffCaseInclude,
  });

  return { ok: true, data: updated };
}

/**
 * closePqrCase
 *
 * Marks a responded PQR case as closed for queue hygiene.
 *
 * @param caseId - PqrCase cuid.
 * @returns Updated case or error.
 * @calledBy staffClosePqrCaseAction
 */
export async function closePqrCase(
  caseId: string,
): Promise<PqrServiceResult<StaffPqrCase>> {
  const existing = await prisma.pqrCase.findUnique({ where: { id: caseId } });
  if (!existing) return { ok: false, error: "Caso no encontrado." };

  const updated = await prisma.pqrCase.update({
    where: { id: caseId },
    data: { status: "CLOSED" },
    include: staffCaseInclude,
  });

  return { ok: true, data: updated };
}
