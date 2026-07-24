import { Prisma, type OrderStatus } from "@prisma/client";

import { computeFees } from "@/features/listings/schemas/listing";
import { prisma } from "@/lib/db";
import { formatOrderMoney } from "@/lib/format-money";
import {
  ACTIVE_ORDER_STATUSES,
  cancelOpenPaymentsForOrder,
  getLatestPaymentForOrder,
  refundPaymentForOrder,
} from "@/lib/payments";

export { formatOrderMoney };

const orderListInclude = {
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
    },
  },
  seller: {
    select: {
      id: true,
      fullName: true,
      username: true,
      avatarUrl: true,
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 5,
  },
  reviews: {
    where: { hiddenAt: null },
    include: {
      reviewer: {
        select: {
          id: true,
          fullName: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.OrderInclude;

export type OrderListItem = Prisma.OrderGetPayload<{
  include: typeof orderListInclude;
}>;

export type OrderDetail = OrderListItem;

export function orderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "AWAITING_PAYMENT":
      return "Pago pendiente";
    case "PAID":
      return "Pagado";
    case "CANCELLED":
      return "Cancelado";
    case "COMPLETED":
      return "Completado";
    default:
      return status;
  }
}

export async function listOrdersForBuyer(buyerId: string) {
  return prisma.order.findMany({
    where: { buyerId },
    include: orderListInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listOrdersForSeller(sellerId: string) {
  return prisma.order.findMany({
    where: { sellerId },
    include: orderListInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderForParticipant(
  orderId: string,
  profileId: string,
) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [{ buyerId: profileId }, { sellerId: profileId }],
    },
    include: orderListInclude,
  });
}

export async function getActiveOrderForListing(listingId: string) {
  return prisma.order.findFirst({
    where: { listingId, status: { in: ACTIVE_ORDER_STATUSES } },
    include: orderListInclude,
  });
}

/** @deprecated Prefer getActiveOrderForListing */
export async function getPendingOrderForListing(listingId: string) {
  return getActiveOrderForListing(listingId);
}

export async function getActiveOrderForBuyerOnListing(
  listingId: string,
  buyerId: string,
) {
  return prisma.order.findFirst({
    where: {
      listingId,
      buyerId,
      status: { in: ACTIVE_ORDER_STATUSES },
    },
    select: { id: true, status: true },
  });
}

/** @deprecated Prefer getActiveOrderForBuyerOnListing */
export async function getPendingOrderForBuyerOnListing(
  listingId: string,
  buyerId: string,
) {
  return getActiveOrderForBuyerOnListing(listingId, buyerId);
}

type CreateOrderResult =
  { ok: true; orderId: string } | { ok: false; error: string };

/**
 * Atomically reserves a PUBLISHED listing and creates an AWAITING_PAYMENT order.
 */
export async function createOrderAndReserveListing(input: {
  listingId: string;
  buyerId: string;
}): Promise<CreateOrderResult> {
  const { listingId, buyerId } = input;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findFirst({
        where: { id: listingId, deletedAt: null },
      });

      if (!listing) {
        throw new OrderError("Anuncio no encontrado.");
      }
      if (listing.sellerId === buyerId) {
        throw new OrderError("No puedes comprar tu propio anuncio.");
      }
      if (listing.status !== "PUBLISHED") {
        throw new OrderError(
          listing.status === "RESERVED"
            ? "Este anuncio ya está reservado."
            : "Este anuncio no está disponible para compra.",
        );
      }

      const existingActive = await tx.order.findFirst({
        where: { listingId, status: { in: ACTIVE_ORDER_STATUSES } },
        select: { id: true },
      });
      if (existingActive) {
        throw new OrderError("Este anuncio ya está reservado.");
      }

      const fees = computeFees(listing.price);
      const platformFee = listing.platformFee ?? fees.platformFee;
      const totalPrice = listing.finalPrice ?? fees.finalPrice;

      const updated = await tx.listing.updateMany({
        where: { id: listingId, status: "PUBLISHED", deletedAt: null },
        data: { status: "RESERVED" },
      });
      if (updated.count !== 1) {
        throw new OrderError("Este anuncio ya no está disponible.");
      }

      return tx.order.create({
        data: {
          listingId,
          buyerId,
          sellerId: listing.sellerId,
          status: "AWAITING_PAYMENT",
          equipmentPrice: listing.price,
          platformFee,
          totalPrice,
          currency: "COP",
        },
        select: { id: true },
      });
    });

    return { ok: true, orderId: order.id };
  } catch (error) {
    if (error instanceof OrderError) {
      return { ok: false, error: error.message };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Este anuncio ya está reservado." };
    }
    throw error;
  }
}

export async function cancelOrder(input: {
  orderId: string;
  actorId: string;
  reason?: string | null;
  siteOrigin: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { orderId, actorId, reason, siteOrigin } = input;

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });
    if (!order) {
      return { ok: false, error: "Pedido no encontrado." };
    }
    if (order.buyerId !== actorId && order.sellerId !== actorId) {
      return { ok: false, error: "No tienes acceso a este pedido." };
    }
    if (order.status !== "AWAITING_PAYMENT" && order.status !== "PAID") {
      return { ok: false, error: "Solo puedes cancelar un pedido activo." };
    }

    if (order.status === "PAID") {
      const refund = await refundPaymentForOrder({
        orderId,
        siteOrigin,
        reason,
      });
      if (!refund.ok) {
        return { ok: false, error: refund.error };
      }
    } else {
      await cancelOpenPaymentsForOrder(orderId);
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          cancelledAt: now,
          cancelledById: actorId,
          cancelReason: reason?.trim() || null,
        },
      });

      await tx.listing.updateMany({
        where: { id: order.listingId, status: "RESERVED" },
        data: { status: "PUBLISHED" },
      });
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof OrderError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * Seller marks the sale complete after payment is confirmed.
 */
export async function completeOrder(input: {
  orderId: string;
  sellerId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { orderId, sellerId } = input;

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId },
      });
      if (!order) {
        throw new OrderError("Pedido no encontrado.");
      }
      if (order.sellerId !== sellerId) {
        throw new OrderError("Solo el vendedor puede completar este pedido.");
      }
      if (order.status !== "PAID") {
        throw new OrderError(
          order.status === "AWAITING_PAYMENT"
            ? "El comprador aún no ha pagado."
            : "Este pedido ya no se puede completar.",
        );
      }

      const now = new Date();
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "COMPLETED",
          completedAt: now,
        },
      });

      await tx.listing.updateMany({
        where: { id: order.listingId, status: "RESERVED" },
        data: { status: "SOLD" },
      });

      await tx.profile.update({
        where: { id: sellerId },
        data: { totalSales: { increment: 1 } },
      });
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof OrderError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

export type OrderTimelineEvent = {
  id: string;
  label: string;
  at: Date;
  done: boolean;
};

export function buildOrderTimeline(order: {
  status: OrderStatus;
  createdAt: Date;
  cancelledAt: Date | null;
  completedAt: Date | null;
  paidAt: Date | null;
}): OrderTimelineEvent[] {
  const events: OrderTimelineEvent[] = [
    {
      id: "created",
      label: "Pedido creado · anuncio reservado",
      at: order.createdAt,
      done: true,
    },
    {
      id: "payment",
      label:
        order.status === "AWAITING_PAYMENT"
          ? "Pago de Compra Garantizada pendiente"
          : "Pago de Compra Garantizada confirmado",
      at: order.paidAt ?? order.createdAt,
      done:
        order.status === "PAID" ||
        order.status === "COMPLETED" ||
        Boolean(order.paidAt),
    },
  ];

  if (order.status === "CANCELLED" && order.cancelledAt) {
    events.push({
      id: "cancelled",
      label: "Pedido cancelado · anuncio publicado de nuevo",
      at: order.cancelledAt,
      done: true,
    });
    return events;
  }

  events.push({
    id: "completed",
    label: "Venta completada",
    at: order.completedAt ?? order.createdAt,
    done: order.status === "COMPLETED",
  });

  if (order.status === "COMPLETED") {
    events.push({
      id: "reviews",
      label: "Reseñas entre comprador y vendedor",
      at: order.completedAt ?? order.createdAt,
      done: true,
    });
  }

  return events;
}

export async function getOrderPaymentSummary(orderId: string) {
  return getLatestPaymentForOrder(orderId);
}

class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}
