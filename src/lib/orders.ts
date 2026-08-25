/**
 * @file orders.ts
 * @description Order create/cancel, participant queries, timeline, and payment summary.
 * @dependencies @prisma/client, @/lib/db, financial-core, shipping
 */

import { Prisma, type OrderStatus } from "@prisma/client";

import {
  authorizeCancelMoney,
  authorizeRefundAfterSellerAbandon,
  canCancelPaidOrder,
  computeOrderFees,
  FeeEntitlementConflictError,
  feeRateBpsFromKind,
  feeRateFromKind,
  PAID_ORDER_CANCEL_BLOCKED_ERROR,
  releaseFeeEntitlementForOrder,
  reserveFeeEntitlement,
  resolveFeeKindForBuyer,
  sellerPaidSelfCancelBlocker,
} from "@/lib/financial-core";
import { prisma } from "@/lib/db";
import { formatOrderMoney } from "@/lib/format-money";
import {
  ACTIVE_ORDER_STATUSES,
  cancelOpenPaymentsForOrder,
  getLatestPaymentForOrder,
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
      sellerRating: true,
      createdAt: true,
      verifikStatus: true,
    },
  },
  seller: {
    select: {
      id: true,
      fullName: true,
      username: true,
      avatarUrl: true,
      city: true,
      sellerRating: true,
      createdAt: true,
      verifikStatus: true,
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 5,
  },
  shipment: {
    include: {
      inspection: true,
    },
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
  feeEntitlementSource: {
    select: {
      id: true,
      status: true,
      expiresAt: true,
      feeRateBps: true,
    },
  },
} satisfies Prisma.OrderInclude;

export type OrderListItem = Prisma.OrderGetPayload<{
  include: typeof orderListInclude;
}>;

export type OrderDetail = OrderListItem;

/**
 * orderStatusLabel
 *
 * Maps OrderStatus to Spanish UI label.
 *
 * @param status - Order status enum.
 * @returns Localized label.
 * @calledBy Order list and detail UI
 */
export function orderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "AWAITING_PAYMENT":
      return "Pago pendiente";
    case "PAID":
      return "Pagado · en custodia";
    case "CANCELLED":
      return "Cancelado";
    case "COMPLETED":
      return "Completado";
    default:
      return status;
  }
}

/**
 * listOrdersForBuyer
 *
 * Lists orders where the profile is the buyer.
 *
 * @param buyerId - Buyer profile UUID.
 * @returns Order list items newest first.
 * @calledBy Compras page
 */
export async function listOrdersForBuyer(buyerId: string) {
  return prisma.order.findMany({
    where: { buyerId },
    include: orderListInclude,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * listOrdersForSeller
 *
 * Lists orders where the profile is the seller.
 *
 * @param sellerId - Seller profile UUID.
 * @returns Order list items newest first.
 * @calledBy Ventas page
 */
export async function listOrdersForSeller(sellerId: string) {
  return prisma.order.findMany({
    where: { sellerId },
    include: orderListInclude,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * getOrderForParticipant
 *
 * Loads an order if the profile is buyer or seller.
 *
 * @param orderId - Order UUID.
 * @param profileId - Participant profile UUID.
 * @returns Order detail or null.
 * @calledBy Order detail pages
 */
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

/**
 * getActiveOrderForListing
 *
 * Finds an active (non-terminal) order for a listing.
 *
 * @param listingId - Listing UUID.
 * @returns Active order or null.
 * @calledBy Listing reserve / buy guards
 */
export async function getActiveOrderForListing(listingId: string) {
  return prisma.order.findFirst({
    where: { listingId, status: { in: ACTIVE_ORDER_STATUSES } },
    include: orderListInclude,
  });
}

/**
 * getPendingOrderForListing
 *
 * Finds an awaiting-payment order for a listing.
 *
 * @param listingId - Listing UUID.
 * @returns Pending order or null.
 * @calledBy Checkout entry
 */
export async function getPendingOrderForListing(listingId: string) {
  return getActiveOrderForListing(listingId);
}

/**
 * getActiveOrderForBuyerOnListing
 *
 * Active order for a specific buyer on a listing.
 *
 * @param listingId - Listing UUID.
 * @param buyerId - Buyer profile UUID.
 * @returns Order or null.
 * @calledBy Buy button state
 */
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

/**
 * getPendingOrderForBuyerOnListing
 *
 * Awaiting-payment order for a specific buyer on a listing.
 *
 * @param listingId - Listing UUID.
 * @param buyerId - Buyer profile UUID.
 * @returns Order or null.
 * @calledBy Resume checkout
 */
export async function getPendingOrderForBuyerOnListing(
  listingId: string,
  buyerId: string,
) {
  return getActiveOrderForBuyerOnListing(listingId, buyerId);
}

type CreateOrderResult =
  | { ok: true; orderId: string; listingSlug: string | null }
  | { ok: false; error: string };

/**
 * createOrderAndReserveListing
 *
 * Creates an order, snapshots fees, and reserves the listing for the buyer.
 *
 * @param input - listingId, buyerId, and fee/shipping context.
 * @returns Created order or error result per implementation.
 * @calledBy Buy / order create actions
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

      const { kind, entitlementId } = await resolveFeeKindForBuyer(buyerId, tx);
      const fees = computeOrderFees({
        salePrice: listing.price,
        feeRate: feeRateFromKind(kind),
        feeRateBps: feeRateBpsFromKind(kind),
        premiumShippingFeePesos: 0,
        sellerFeePesos: 0,
      });

      const updated = await tx.listing.updateMany({
        where: { id: listingId, status: "PUBLISHED", deletedAt: null },
        data: { status: "RESERVED" },
      });
      if (updated.count !== 1) {
        throw new OrderError("Este anuncio ya no está disponible.");
      }

      const created = await tx.order.create({
        data: {
          listingId,
          buyerId,
          sellerId: listing.sellerId,
          status: "AWAITING_PAYMENT",
          equipmentPrice: fees.salePrice,
          platformFee: fees.platformFee,
          totalPrice: fees.buyerTotal,
          currency: "COP",
          feeRateBps: fees.feeRateBps,
          wompiCollectionPesos: fees.wompiCollectionPesos,
          wompiPayoutPesos: fees.wompiPayoutPesos,
          truephoneRevenuePesos: fees.truephoneRevenuePesos,
          sellerAmountPesos: fees.sellerAmountPesos,
          premiumShippingFeePesos: fees.premiumShippingFeePesos,
          sellerFeePesos: fees.sellerFeePesos,
        },
        select: { id: true },
      });

      if (entitlementId) {
        await reserveFeeEntitlement(tx, {
          entitlementId,
          usedOnOrderId: created.id,
        });
      }

      return { id: created.id, listingSlug: listing.slug };
    });

    return { ok: true, orderId: order.id, listingSlug: order.listingSlug };
  } catch (error) {
    if (error instanceof OrderError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof FeeEntitlementConflictError) {
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

/**
 * cancelOrder
 *
 * Cancels an order via Financial Core money rules and releases the listing when needed.
 * Sellers cannot self-cancel PAID orders; pass asOpsSellerAbandon only from REVIEWER/ADMIN ops actions.
 *
 * @param input - orderId, actorId, reason, siteOrigin; optional asOpsSellerAbandon for ops.
 * @returns Cancel result.
 * @calledBy Order cancel actions
 */
export async function cancelOrder(input: {
  orderId: string;
  actorId: string;
  reason?: string | null;
  siteOrigin: string;
  /** Ops-only paid seller-abandon; caller must gate REVIEWER/ADMIN. */
  asOpsSellerAbandon?: boolean;
}): Promise<
  | {
      ok: true;
      message?: string;
      listingId?: string;
      listingSlug?: string | null;
    }
  | { ok: false; error: string }
> {
  const { orderId, actorId, reason, siteOrigin, asOpsSellerAbandon } = input;

  try {
    // Defend API: reject seller self-cancel on PAID before money side effects.
    const existing = await prisma.order.findFirst({
      where: { id: orderId },
      select: { status: true, sellerId: true },
    });
    if (!existing) {
      return { ok: false, error: "Pedido no encontrado." };
    }
    const sellerPaidBlock = sellerPaidSelfCancelBlocker({
      orderStatus: existing.status,
      actorId,
      sellerId: existing.sellerId,
      asOpsSellerAbandon,
    });
    if (sellerPaidBlock) {
      return { ok: false, error: sellerPaidBlock };
    }

    const money = await authorizeCancelMoney({
      orderId,
      actorId,
      reason,
      siteOrigin,
      asOpsSellerAbandon,
    });
    if (!money.ok) {
      return { ok: false, error: money.error };
    }

    if (money.mode === "pre_payment") {
      await cancelOpenPaymentsForOrder(orderId);
    }

    const now = new Date();
    let listingId: string | undefined;
    let listingSlug: string | null | undefined;
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId },
        include: { listing: { select: { slug: true } } },
      });
      if (!order) throw new OrderError("Pedido no encontrado.");
      listingId = order.listingId;
      listingSlug = order.listing.slug;
      if (order.status !== "AWAITING_PAYMENT" && order.status !== "PAID") {
        throw new OrderError("Este pedido ya no se puede cancelar.");
      }
      if (order.status === "PAID" && !canCancelPaidOrder(order)) {
        throw new OrderError(PAID_ORDER_CANCEL_BLOCKED_ERROR);
      }

      if (money.mode === "pre_payment") {
        if (order.status === "PAID") {
          throw new OrderError(
            "El pago se acaba de confirmar. Recarga la página e intenta cancelar de nuevo para solicitar el reembolso.",
          );
        }
        const succeededPayment = await tx.payment.findFirst({
          where: { orderId, status: "SUCCEEDED" },
          select: { id: true },
        });
        if (succeededPayment) {
          throw new OrderError(
            "El pago se acaba de confirmar. Recarga la página e intenta cancelar de nuevo para solicitar el reembolso.",
          );
        }
        await releaseFeeEntitlementForOrder(tx, orderId);
      }

      const cancelled = await tx.order.updateMany({
        where: {
          id: orderId,
          status: { in: ["AWAITING_PAYMENT", "PAID"] },
        },
        data: {
          status: "CANCELLED",
          cancelledAt: now,
          cancelledById: actorId,
          cancelReason: reason?.trim() || null,
        },
      });
      if (cancelled.count !== 1) {
        throw new OrderError("Este pedido ya no se puede cancelar.");
      }

      // Buyer / unpaid cancel: listing is public again.
      // Seller abandon (ops): back to review — do not auto-republish.
      if (money.mode === "seller_abandon_entitlement") {
        await tx.listing.updateMany({
          where: { id: order.listingId, status: "RESERVED" },
          data: {
            status: "PENDING_REVIEW",
            rejectionReason: null,
            reviewerNotes: null,
            reviewedAt: null,
            approvedAt: null,
            reviewerId: null,
          },
        });
      } else {
        await tx.listing.updateMany({
          where: { id: order.listingId, status: "RESERVED" },
          data: { status: "PUBLISHED" },
        });
      }
    });

    if (money.mode === "seller_abandon_entitlement") {
      return {
        ok: true,
        listingId,
        listingSlug,
        message:
          "Cancelación del vendedor registrada. El anuncio vuelve a revisión (no se publica solo). El comprador puede elegir reembolso o una compra de reemplazo con 8% de comisión (una sola vez).",
      };
    }

    return { ok: true, listingId, listingSlug };
  } catch (error) {
    if (error instanceof OrderError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * chooseRefundAfterSellerAbandon
 *
 * Buyer opts for a full refund instead of the one-time 8% replacement purchase.
 *
 * @param input.orderId - Source order UUID.
 * @param input.buyerId - Buyer profile UUID.
 * @param input.siteOrigin - Origin for payment provider resolution.
 * @returns Success or Spanish error from Financial Core.
 * @calledBy chooseRefundAfterSellerAbandonAction
 */
export async function chooseRefundAfterSellerAbandon(input: {
  orderId: string;
  buyerId: string;
  siteOrigin: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const money = await authorizeRefundAfterSellerAbandon(input);
  if (!money.ok) return { ok: false, error: money.error };
  return { ok: true };
}

/**
 * completeOrder
 *
 * Legacy/no-op complete path; settlement owns completion after confirm/payout.
 *
 * @param _input - Unused placeholder input.
 * @returns Result indicating completion is handled elsewhere.
 * @calledBy Older callers if any
 */
export async function completeOrder(_input: {
  orderId: string;
  sellerId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  void _input;
  return {
    ok: false,
    error:
      "La liquidación la autoriza TruePhone tras la recepción confirmada por el comprador y su confirmación del dispositivo (o 24 horas). El vendedor ya no puede marcar el pedido como completado.",
  };
}

export type OrderTimelineEvent = {
  id: string;
  label: string;
  at: Date;
  done: boolean;
};

/**
 * buildOrderTimeline
 *
 * Builds chronological timeline events matching Financial Model §4:
 * hold → ship → received → confirm/24h → payout → completed.
 *
 * @param order - Order with payment/shipment/settlement timestamps.
 * @param now - Optional clock for 24h expiry (defaults to Date.now()).
 * @returns OrderTimelineEvent array.
 * @calledBy OrderTimeline
 */
export function buildOrderTimeline(
  order: {
    status: OrderStatus;
    createdAt: Date;
    cancelledAt: Date | null;
    completedAt: Date | null;
    paidAt: Date | null;
    fundsHeldAt?: Date | null;
    payoutCompletedAt?: Date | null;
    buyerConfirmedAt?: Date | null;
    buyerConfirmDeadlineAt?: Date | null;
    shipment?: {
      methodSelectedAt: Date;
      trackingUploadedAt: Date | null;
      deliveredAt: Date | null;
      method: string;
    } | null;
  },
  now: Date = new Date(),
): OrderTimelineEvent[] {
  const paid =
    order.status === "PAID" ||
    order.status === "COMPLETED" ||
    Boolean(order.paidAt);

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
          : "Pago confirmado · fondos en custodia",
      at: order.paidAt ?? order.fundsHeldAt ?? order.createdAt,
      done: paid,
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

  if (order.shipment) {
    events.push({
      id: "shipping-method",
      label:
        order.shipment.method === "PREMIUM_BOGOTA"
          ? "Envío Premium Bogotá elegido"
          : "Envío por transportadora elegido",
      at: order.shipment.methodSelectedAt,
      done: true,
    });
    if (order.shipment.trackingUploadedAt) {
      events.push({
        id: "tracking",
        label: "Código de seguimiento publicado",
        at: order.shipment.trackingUploadedAt,
        done: true,
      });
    }
    events.push({
      id: "delivered",
      label: order.shipment.deliveredAt
        ? "Comprador marcó «Ya recibí»"
        : "Recepción del comprador («Ya recibí»)",
      at: order.shipment.deliveredAt ?? order.createdAt,
      done: Boolean(order.shipment.deliveredAt),
    });
  } else if (paid) {
    events.push({
      id: "shipping-pending",
      label: "Envío pendiente",
      at: order.paidAt ?? order.fundsHeldAt ?? order.createdAt,
      done: false,
    });
  }

  const confirmDeadlinePassed = Boolean(
    order.buyerConfirmDeadlineAt &&
    order.buyerConfirmDeadlineAt.getTime() <= now.getTime(),
  );
  const confirmDone =
    Boolean(order.buyerConfirmedAt) ||
    confirmDeadlinePassed ||
    order.status === "COMPLETED";

  let confirmLabel = "Confirmación del comprador (tras recepción)";
  if (order.buyerConfirmedAt) {
    confirmLabel = "Comprador confirmó el dispositivo";
  } else if (confirmDeadlinePassed || order.status === "COMPLETED") {
    confirmLabel = "24h sin reporte · pago autorizado";
  } else if (order.buyerConfirmDeadlineAt) {
    confirmLabel = "Ventana de 24h para confirmar o reportar";
  }

  events.push({
    id: "confirm",
    label: confirmLabel,
    at:
      order.buyerConfirmedAt ?? order.buyerConfirmDeadlineAt ?? order.createdAt,
    done: confirmDone,
  });

  events.push({
    id: "payout",
    label: order.payoutCompletedAt
      ? "Pago enviado al vendedor"
      : "Pago al vendedor",
    at: order.payoutCompletedAt ?? order.completedAt ?? order.createdAt,
    done: Boolean(order.payoutCompletedAt) || order.status === "COMPLETED",
  });

  events.push({
    id: "completed",
    label: "Pedido completado",
    at: order.completedAt ?? order.payoutCompletedAt ?? order.createdAt,
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

/**
 * getOrderPaymentSummary
 *
 * Loads payment rows and fee snapshot fields for an order.
 *
 * @param orderId - Order UUID.
 * @returns Payment summary payload.
 * @calledBy Order detail payment panel
 */
export async function getOrderPaymentSummary(orderId: string) {
  return getLatestPaymentForOrder(orderId);
}

class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}
