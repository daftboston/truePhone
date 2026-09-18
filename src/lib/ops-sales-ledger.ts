/**
 * @file ops-sales-ledger.ts
 * @description Ops sales ledger queries for /revision/ventas (F1).
 */

import type { OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export type OpsSalesLedgerFilters = {
  sellerId?: string;
  buyerId?: string;
  modelId?: string;
  listingQ?: string;
  status?: OrderStatus;
  from?: Date;
  to?: Date;
  take?: number;
  skip?: number;
};

const participantSelect = {
  id: true,
  fullName: true,
  username: true,
} satisfies Prisma.ProfileSelect;

const reviewerOrderSelect = {
  id: true,
  status: true,
  equipmentPrice: true,
  platformFee: true,
  totalPrice: true,
  currency: true,
  paidAt: true,
  completedAt: true,
  cancelledAt: true,
  cancelReason: true,
  payoutFrozen: true,
  fundsHeldAt: true,
  payoutAuthorizedAt: true,
  payoutCompletedAt: true,
  buyerConfirmedAt: true,
  buyerConfirmDeadlineAt: true,
  createdAt: true,
  updatedAt: true,
  listing: {
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      status: true,
      publishedAt: true,
      approvedAt: true,
      iphoneModel: { select: { id: true, name: true } },
    },
  },
  buyer: { select: participantSelect },
  seller: { select: participantSelect },
  shipment: {
    select: {
      method: true,
      status: true,
      deliveredAt: true,
      inTransitAt: true,
      trackingUploadedAt: true,
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      status: true,
      paidAt: true,
      amount: true,
    },
  },
  supportCases: {
    where: { status: { notIn: ["RESOLVED", "WITHDRAWN", "REJECTED"] } },
    take: 1,
    select: { id: true, status: true, type: true },
  },
} satisfies Prisma.OrderSelect;

const adminOrderSelect = {
  ...reviewerOrderSelect,
  sellerAmountPesos: true,
  wompiCollectionPesos: true,
  wompiPayoutPesos: true,
  truephoneRevenuePesos: true,
  payouts: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      status: true,
      amountPesos: true,
      provider: true,
      sellerBankAccount: {
        select: {
          id: true,
          bankName: true,
          accountType: true,
          accountNumber: true,
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

export type OpsSalesLedgerRowReviewer = Prisma.OrderGetPayload<{
  select: typeof reviewerOrderSelect;
}>;

export type OpsSalesLedgerRowAdmin = Prisma.OrderGetPayload<{
  select: typeof adminOrderSelect;
}>;

/**
 * buildOpsSalesWhere
 *
 * Builds filter predicate for ops sales ledger.
 */
export function buildOpsSalesWhere(
  filters: OpsSalesLedgerFilters,
): Prisma.OrderWhereInput {
  const and: Prisma.OrderWhereInput[] = [];

  if (filters.sellerId) and.push({ sellerId: filters.sellerId });
  if (filters.buyerId) and.push({ buyerId: filters.buyerId });
  if (filters.status) and.push({ status: filters.status });
  if (filters.from || filters.to) {
    and.push({
      updatedAt: {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lte: filters.to } : {}),
      },
    });
  }
  if (filters.modelId) {
    and.push({ listing: { iphoneModelId: filters.modelId } });
  }
  const q = filters.listingQ?.trim();
  if (q) {
    and.push({
      OR: [
        { listing: { slug: { contains: q, mode: "insensitive" } } },
        { listing: { id: q } },
        { listing: { title: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

/**
 * listOpsSalesLedger
 *
 * Returns orders for ops ventas with role-appropriate field stripping.
 */
export async function listOpsSalesLedger(
  filters: OpsSalesLedgerFilters,
  role: "REVIEWER" | "ADMIN",
) {
  const select = role === "ADMIN" ? adminOrderSelect : reviewerOrderSelect;
  return prisma.order.findMany({
    where: buildOpsSalesWhere(filters),
    select,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: filters.take ?? 50,
    skip: filters.skip ?? 0,
  });
}

/**
 * countOpsSalesLedger
 *
 * Counts orders matching ops ventas filters.
 */
export async function countOpsSalesLedger(filters: OpsSalesLedgerFilters) {
  return prisma.order.count({ where: buildOpsSalesWhere(filters) });
}

/**
 * opsSalesStatusLabel
 *
 * Human-readable status chip for ops ventas.
 */
export function opsSalesStatusLabel(row: {
  status: OrderStatus;
  payoutFrozen: boolean;
  supportCases: { type: string }[];
}): string {
  if (row.payoutFrozen) return "Disputa / congelado";
  if (row.supportCases.length > 0) return "Soporte abierto";
  switch (row.status) {
    case "AWAITING_PAYMENT":
      return "Sin pagar";
    case "PAID":
      return "Pagado";
    case "COMPLETED":
      return "Completado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return row.status;
  }
}

/**
 * stripBankFieldsFromLedgerRow
 *
 * Ensures reviewer JSON never includes admin-only bank columns.
 */
export function stripBankFieldsFromLedgerRow<T extends Record<string, unknown>>(
  row: T,
  isAdmin: boolean,
): T {
  if (isAdmin) return row;
  const clone = { ...row } as Record<string, unknown>;
  delete clone.payouts;
  delete clone.sellerAmountPesos;
  delete clone.wompiCollectionPesos;
  delete clone.wompiPayoutPesos;
  delete clone.truephoneRevenuePesos;
  return clone as T;
}
