/**
 * @file order-support-service.ts
 * @description Persists seller order-support cases with ownership, duplicate, and payout-freeze guards.
 * @dependencies @prisma/client, prisma, financial-core settlement, order-support classifiers
 */

import {
  OrderSupportCaseStatus,
  type OrderSupportCaseType,
  Prisma,
} from "@prisma/client";

import {
  freezePayoutInTransaction,
  releaseFulfillmentExceptionFreeze,
} from "@/lib/financial-core/settlement";
import { prisma } from "@/lib/db";
import { classifyOrderSupportOptions } from "@/lib/orders/order-support";

export const ACTIVE_ORDER_SUPPORT_STATUSES: OrderSupportCaseStatus[] = [
  "PENDING",
  "IN_REVIEW",
  "NEEDS_SELLER_RESPONSE",
  "ESCALATED",
];

const sellerCaseInclude = {
  assignedStaff: {
    select: { id: true, fullName: true, username: true, role: true },
  },
  messages: {
    where: { isInternal: false },
    include: {
      sender: {
        select: { id: true, fullName: true, username: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.OrderSupportCaseInclude;

export type SellerOrderSupportCase = Prisma.OrderSupportCaseGetPayload<{
  include: typeof sellerCaseInclude;
}>;

const staffCaseInclude = {
  order: {
    include: {
      listing: {
        include: {
          iphoneModel: true,
          images: {
            where: { imageType: "gallery" as const },
            orderBy: { displayOrder: "asc" as const },
            take: 1,
          },
        },
      },
      buyer: {
        select: {
          id: true,
          fullName: true,
          username: true,
          avatarUrl: true,
          city: true,
        },
      },
      seller: {
        select: {
          id: true,
          fullName: true,
          username: true,
          avatarUrl: true,
          city: true,
          verifikStatus: true,
        },
      },
      shipment: { include: { inspection: true } },
      payments: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
      },
    },
  },
  seller: {
    select: {
      id: true,
      fullName: true,
      username: true,
      role: true,
      verifikStatus: true,
    },
  },
  assignedStaff: {
    select: { id: true, fullName: true, username: true, role: true },
  },
  messages: {
    include: {
      sender: {
        select: { id: true, fullName: true, username: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.OrderSupportCaseInclude;

export type StaffOrderSupportCase = Prisma.OrderSupportCaseGetPayload<{
  include: typeof staffCaseInclude;
}>;

type SupportServiceResult<T> =
  { ok: true; data: T } | { ok: false; error: string };

/**
 * supportAvailabilityForType
 *
 * Selects classifier availability for one persisted case type.
 *
 * @param type - Requested support case type.
 * @param classification - Current contextual option matrix.
 * @returns Availability and explanation for the requested path.
 * @calledBy createOrderSupportCase
 */
function supportAvailabilityForType(
  type: OrderSupportCaseType,
  classification: ReturnType<typeof classifyOrderSupportOptions>,
) {
  switch (type) {
    case "SELLER_CANCELLATION":
      return classification.cancellation;
    case "FULFILLMENT_EXCEPTION":
      return classification.fulfillmentException;
    case "GENERAL_SUPPORT":
      return classification.generalSupport;
  }
}

/**
 * createOrderSupportCase
 *
 * Creates one eligible seller case and freezes payout atomically for fulfillment exceptions.
 * The freeze ledger row stores supportCaseId so closing the case cannot drop a
 * chargeback or buyer-dispute freeze that already existed (or arrives later).
 *
 * @param input - Seller, order, case type, and required initial reason.
 * @returns Created case id or a recoverable Spanish error.
 * @calledBy createOrderSupportCaseAction
 */
export async function createOrderSupportCase(input: {
  orderId: string;
  sellerId: string;
  type: OrderSupportCaseType;
  initialReason: string;
}): Promise<SupportServiceResult<{ caseId: string }>> {
  try {
    const created = await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findFirst({
          where: { id: input.orderId },
          include: {
            shipment: { include: { inspection: true } },
          },
        });
        if (!order || order.sellerId !== input.sellerId) {
          throw new OrderSupportError(
            "No encontramos este pedido entre tus ventas.",
          );
        }

        const availability = supportAvailabilityForType(
          input.type,
          classifyOrderSupportOptions(order),
        );
        if (!availability.allowed) {
          throw new OrderSupportError(availability.explanation);
        }

        const duplicate = await tx.orderSupportCase.findFirst({
          where: {
            orderId: order.id,
            sellerId: input.sellerId,
            type: input.type,
            status: { in: ACTIVE_ORDER_SUPPORT_STATUSES },
          },
          select: { id: true },
        });
        if (duplicate) {
          throw new OrderSupportError(
            "Ya tienes una solicitud activa de este tipo para el pedido.",
          );
        }

        const supportCase = await tx.orderSupportCase.create({
          data: {
            orderId: order.id,
            sellerId: input.sellerId,
            type: input.type,
            initialReason: input.initialReason,
          },
          select: { id: true },
        });

        if (input.type === "FULFILLMENT_EXCEPTION") {
          await freezePayoutInTransaction(tx, {
            orderId: order.id,
            reason: `Seller fulfillment exception · support case ${supportCase.id}`,
            metadata: { supportCaseId: supportCase.id },
          });
        }

        return supportCase;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return { ok: true, data: { caseId: created.id } };
  } catch (error) {
    if (error instanceof OrderSupportError) {
      return { ok: false, error: error.message };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      return {
        ok: false,
        error:
          error.code === "P2002"
            ? "Ya existe una solicitud activa para este pedido."
            : "El pedido cambió mientras enviabas la solicitud. Intenta de nuevo.",
      };
    }
    throw error;
  }
}

/**
 * listSellerOrderSupportCases
 *
 * Loads a seller-safe transcript without staff-only internal notes.
 *
 * @param orderId - Order whose support history is shown.
 * @param sellerId - Authenticated seller profile id.
 * @returns Cases newest first with public messages.
 * @calledBy seller order detail pages
 */
export async function listSellerOrderSupportCases(
  orderId: string,
  sellerId: string,
): Promise<SellerOrderSupportCase[]> {
  return prisma.orderSupportCase.findMany({
    where: { orderId, sellerId },
    include: sellerCaseInclude,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * countActionableOrderSupportCases
 *
 * Counts submitted cases that still require seller or staff action.
 *
 * @returns Number shown on the review hub queue card.
 * @calledBy ReviewHubPage
 */
export async function countActionableOrderSupportCases() {
  return prisma.orderSupportCase.count({
    where: { status: { in: ACTIVE_ORDER_SUPPORT_STATUSES } },
  });
}

/**
 * listOrderSupportCasesForStaff
 *
 * Lists request-backed support queue rows for one status group.
 *
 * @param statuses - Workflow statuses represented by the selected queue tab.
 * @returns Cases oldest first so submitted work is handled fairly.
 * @calledBy OrderSupportQueuePage
 */
export async function listOrderSupportCasesForStaff(
  statuses: OrderSupportCaseStatus[],
) {
  return prisma.orderSupportCase.findMany({
    where: { status: { in: statuses } },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          payoutFrozen: true,
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
              images: {
                where: { imageType: "gallery" },
                orderBy: { displayOrder: "asc" },
                take: 1,
              },
            },
          },
        },
      },
      seller: {
        select: { id: true, fullName: true, username: true },
      },
      assignedStaff: {
        select: { id: true, fullName: true, username: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * getOrderSupportCaseForStaff
 *
 * Loads complete order, party, shipment, payment, transcript, and internal-note context.
 *
 * @param caseId - Support case UUID.
 * @returns Staff case detail or null.
 * @calledBy OrderSupportCasePage and staff actions
 */
export async function getOrderSupportCaseForStaff(
  caseId: string,
): Promise<StaffOrderSupportCase | null> {
  return prisma.orderSupportCase.findUnique({
    where: { id: caseId },
    include: staffCaseInclude,
  });
}

/**
 * claimOrderSupportCase
 *
 * Optimistically assigns an active case to one staff member and marks first review.
 *
 * @param input - Case and authenticated staff profile.
 * @returns Claimed case id or assignment conflict.
 * @calledBy claimOrderSupportCaseAction and decision actions
 */
export async function claimOrderSupportCase(input: {
  caseId: string;
  staffId: string;
}): Promise<SupportServiceResult<{ caseId: string }>> {
  const existing = await prisma.orderSupportCase.findUnique({
    where: { id: input.caseId },
    select: { id: true, status: true, assignedStaffId: true },
  });
  if (!existing) return { ok: false, error: "Solicitud no encontrada." };
  if (!ACTIVE_ORDER_SUPPORT_STATUSES.includes(existing.status)) {
    return { ok: false, error: "Esta solicitud ya está cerrada." };
  }
  if (existing.assignedStaffId === input.staffId) {
    return { ok: true, data: { caseId: existing.id } };
  }
  if (existing.assignedStaffId) {
    return {
      ok: false,
      error: "Otro miembro del equipo ya tiene asignada esta solicitud.",
    };
  }

  const claimed = await prisma.orderSupportCase.updateMany({
    where: {
      id: input.caseId,
      assignedStaffId: null,
      status: { in: ACTIVE_ORDER_SUPPORT_STATUSES },
    },
    data: {
      assignedStaffId: input.staffId,
      status: existing.status === "PENDING" ? "IN_REVIEW" : existing.status,
      reviewedAt: new Date(),
    },
  });
  if (claimed.count !== 1) {
    return {
      ok: false,
      error: "La solicitud cambió mientras intentabas asignarla. Recarga.",
    };
  }
  return { ok: true, data: { caseId: input.caseId } };
}

/**
 * addStaffOrderSupportMessage
 *
 * Appends a seller-visible reply or staff-only internal note to an assigned active case.
 *
 * @param input - Case, staff sender, body, and internal visibility.
 * @returns Case id or assignment/lifecycle error.
 * @calledBy staffOrderSupportMessageAction
 */
export async function addStaffOrderSupportMessage(input: {
  caseId: string;
  staffId: string;
  body: string;
  isInternal: boolean;
}): Promise<
  SupportServiceResult<{ caseId: string; sellerId: string; messageId: string }>
> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const supportCase = await tx.orderSupportCase.findFirst({
        where: {
          id: input.caseId,
          assignedStaffId: input.staffId,
          status: { in: ACTIVE_ORDER_SUPPORT_STATUSES },
        },
        select: { id: true, sellerId: true },
      });
      if (!supportCase) {
        throw new OrderSupportError(
          "Asigna esta solicitud antes de responder.",
        );
      }

      const message = await tx.orderSupportMessage.create({
        data: {
          caseId: supportCase.id,
          senderId: input.staffId,
          body: input.body,
          isInternal: input.isInternal,
        },
        select: { id: true },
      });
      return { ...supportCase, messageId: message.id };
    });
    return {
      ok: true,
      data: {
        caseId: result.id,
        sellerId: result.sellerId,
        messageId: result.messageId,
      },
    };
  } catch (error) {
    if (error instanceof OrderSupportError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * transitionOrderSupportCase
 *
 * Applies a non-cancellation staff status transition with assignment and role checks delegated to the action.
 * Fulfillment unfreeze is gated by Financial Core so a chargeback or buyer dispute stays frozen.
 *
 * @param input - Assigned case, target status, note, and optional payout unfreeze.
 * @returns Case and seller identifiers for revalidation/notification.
 * @calledBy staffOrderSupportDecisionAction
 */
export async function transitionOrderSupportCase(input: {
  caseId: string;
  staffId: string;
  status: "NEEDS_SELLER_RESPONSE" | "ESCALATED" | "REJECTED" | "RESOLVED";
  note: string;
  unfreezePayout?: boolean;
}): Promise<
  SupportServiceResult<{
    caseId: string;
    orderId: string;
    sellerId: string;
    eventKey: string;
  }>
> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const supportCase = await tx.orderSupportCase.findFirst({
        where: {
          id: input.caseId,
          assignedStaffId: input.staffId,
          status: { in: ACTIVE_ORDER_SUPPORT_STATUSES },
        },
        select: { id: true, orderId: true, sellerId: true },
      });
      if (!supportCase) {
        throw new OrderSupportError(
          "Asigna esta solicitud antes de cambiar su estado.",
        );
      }

      const updated = await tx.orderSupportCase.update({
        where: { id: supportCase.id },
        data: {
          status: input.status,
          decisionNote: input.note,
          resolvedAt:
            input.status === "REJECTED" || input.status === "RESOLVED"
              ? new Date()
              : null,
        },
        select: { updatedAt: true },
      });
      if (input.unfreezePayout) {
        await releaseFulfillmentExceptionFreeze(tx, {
          orderId: supportCase.orderId,
          caseId: supportCase.id,
          memo: `Fulfillment support resolved · case ${supportCase.id}`,
        });
      }
      return {
        ...supportCase,
        eventKey: updated.updatedAt.getTime().toString(),
      };
    });

    return {
      ok: true,
      data: {
        caseId: result.id,
        orderId: result.orderId,
        sellerId: result.sellerId,
        eventKey: result.eventKey,
      },
    };
  } catch (error) {
    if (error instanceof OrderSupportError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * approveOrderSupportCaseAfterCancellation
 *
 * Marks an assigned cancellation request approved only after Financial Core cancellation succeeds.
 *
 * @param input - Case, approving staff, and durable decision note.
 * @returns Case identifiers or race/lifecycle error.
 * @calledBy staffOrderSupportDecisionAction
 */
export async function approveOrderSupportCaseAfterCancellation(input: {
  caseId: string;
  staffId: string;
  note: string;
}): Promise<
  SupportServiceResult<{ caseId: string; orderId: string; sellerId: string }>
> {
  const supportCase = await prisma.orderSupportCase.findFirst({
    where: {
      id: input.caseId,
      assignedStaffId: input.staffId,
      status: { in: ACTIVE_ORDER_SUPPORT_STATUSES },
    },
    select: { id: true, orderId: true, sellerId: true },
  });
  if (!supportCase) {
    return {
      ok: false,
      error: "La solicitud cambió antes de guardar la aprobación. Recarga.",
    };
  }

  const approved = await prisma.orderSupportCase.updateMany({
    where: {
      id: supportCase.id,
      assignedStaffId: input.staffId,
      status: { in: ACTIVE_ORDER_SUPPORT_STATUSES },
    },
    data: {
      status: "APPROVED",
      decisionNote: input.note,
      resolvedAt: new Date(),
    },
  });
  if (approved.count !== 1) {
    return {
      ok: false,
      error: "La solicitud cambió antes de guardar la aprobación. Recarga.",
    };
  }
  return {
    ok: true,
    data: {
      caseId: supportCase.id,
      orderId: supportCase.orderId,
      sellerId: supportCase.sellerId,
    },
  };
}

/**
 * replyToOrderSupportCaseAsSeller
 *
 * Adds a seller message only to an active case they own.
 *
 * @param input - Case, seller, and validated message body.
 * @returns Case id or access/lifecycle error.
 * @calledBy replyToOrderSupportCaseAction
 */
export async function replyToOrderSupportCaseAsSeller(input: {
  caseId: string;
  sellerId: string;
  body: string;
}): Promise<
  SupportServiceResult<{
    caseId: string;
    orderId: string;
    assignedStaffId: string | null;
    messageId: string;
  }>
> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const supportCase = await tx.orderSupportCase.findFirst({
        where: { id: input.caseId, sellerId: input.sellerId },
        select: {
          id: true,
          orderId: true,
          assignedStaffId: true,
          status: true,
        },
      });
      if (!supportCase) {
        throw new OrderSupportError("No tienes acceso a esta solicitud.");
      }
      if (!ACTIVE_ORDER_SUPPORT_STATUSES.includes(supportCase.status)) {
        throw new OrderSupportError("Esta solicitud ya está cerrada.");
      }

      const message = await tx.orderSupportMessage.create({
        data: {
          caseId: supportCase.id,
          senderId: input.sellerId,
          body: input.body,
        },
        select: { id: true },
      });
      if (supportCase.status === "NEEDS_SELLER_RESPONSE") {
        await tx.orderSupportCase.update({
          where: { id: supportCase.id },
          data: { status: "IN_REVIEW" },
        });
      }
      return { ...supportCase, messageId: message.id };
    });

    return {
      ok: true,
      data: {
        caseId: result.id,
        orderId: result.orderId,
        assignedStaffId: result.assignedStaffId,
        messageId: result.messageId,
      },
    };
  } catch (error) {
    if (error instanceof OrderSupportError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * withdrawOrderSupportCase
 *
 * Withdraws only an untouched pending case and preserves its audit row.
 * Fulfillment-exception withdraw releases payoutFrozen only when this case is
 * the sole freeze source.
 *
 * @param input - Case and authenticated seller.
 * @returns Case id or lifecycle error.
 * @calledBy withdrawOrderSupportCaseAction
 */
export async function withdrawOrderSupportCase(input: {
  caseId: string;
  sellerId: string;
}): Promise<SupportServiceResult<{ caseId: string }>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const supportCase = await tx.orderSupportCase.findFirst({
        where: {
          id: input.caseId,
          sellerId: input.sellerId,
          status: "PENDING",
          assignedStaffId: null,
          reviewedAt: null,
        },
        select: { id: true, orderId: true, type: true },
      });
      if (!supportCase) {
        throw new OrderSupportError(
          "Solo puedes retirar una solicitud pendiente que el equipo aún no haya revisado.",
        );
      }

      await tx.orderSupportCase.update({
        where: { id: supportCase.id },
        data: { status: "WITHDRAWN", resolvedAt: new Date() },
      });
      if (supportCase.type === "FULFILLMENT_EXCEPTION") {
        await releaseFulfillmentExceptionFreeze(tx, {
          orderId: supportCase.orderId,
          caseId: supportCase.id,
          memo: `Seller withdrew untouched fulfillment exception · support case ${supportCase.id}`,
        });
      }
      return supportCase;
    });

    return { ok: true, data: { caseId: result.id } };
  } catch (error) {
    if (error instanceof OrderSupportError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * OrderSupportError
 *
 * Represents an expected ownership, duplicate, or lifecycle failure.
 */
class OrderSupportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderSupportError";
  }
}
