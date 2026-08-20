/**
 * @file payments.ts
 * @description Checkout orchestration, payment status updates, refunds, and Wompi webhooks.
 * @dependencies @prisma/client, @/lib/db, financial-core, payments providers
 */

import {
  Prisma,
  type OrderStatus,
  type PaymentProvider,
  type PaymentStatus,
} from "@prisma/client";

import {
  recordChargebackReceived,
  recordPaymentHold,
} from "@/lib/financial-core";
import { prisma } from "@/lib/db";
import {
  notifySellerOrderPaid,
  safeNotify,
} from "@/lib/notifications/marketplace";
import { resolvePaymentProvider } from "@/lib/payments/resolve-provider";
import {
  verifyWompiEventChecksum,
  wompiCentsToPesos,
} from "@/lib/payments/provider";
import { getWompiEnv } from "@/lib/payments/wompi";

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "AWAITING_PAYMENT",
  "PAID",
];

/**
 * paymentStatusLabel
 *
 * Maps PaymentStatus to Spanish UI label.
 *
 * @param status - Payment status enum.
 * @returns Localized label.
 * @calledBy Payment and order UI
 */
export function paymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "REQUIRES_ACTION":
      return "En checkout";
    case "SUCCEEDED":
      return "Pagado";
    case "FAILED":
      return "Fallido";
    case "REFUNDED":
      return "Reembolsado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
}

/**
 * isOrderAwaitingPayment
 *
 * @param status - Order status.
 * @returns True when status is AWAITING_PAYMENT.
 * @calledBy Checkout guards
 */
export function isOrderAwaitingPayment(status: OrderStatus) {
  return status === "AWAITING_PAYMENT";
}

/**
 * isOrderPaid
 *
 * @param status - Order status.
 * @returns True when status is PAID.
 * @calledBy Shipping and settlement guards
 */
export function isOrderPaid(status: OrderStatus) {
  return status === "PAID" || status === "COMPLETED";
}

type PaymentResult =
  | { ok: true; paymentId: string; checkoutUrl: string }
  | { ok: false; error: string };

class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentError";
  }
}

const paymentInclude = {
  order: {
    select: {
      id: true,
      status: true,
      listingId: true,
      buyerId: true,
      sellerId: true,
      totalPrice: true,
      currency: true,
      listing: { select: { title: true, slug: true } },
    },
  },
  buyer: {
    select: {
      id: true,
      fullName: true,
      username: true,
    },
  },
} satisfies Prisma.PaymentInclude;

export type PaymentListItem = Prisma.PaymentGetPayload<{
  include: typeof paymentInclude;
}>;

/**
 * listPaymentsForOrder
 *
 * Lists payment attempts for an order newest first.
 *
 * @param orderId - Order UUID.
 * @returns Payment list items.
 * @calledBy Order payment panels
 */
export async function listPaymentsForOrder(orderId: string) {
  return prisma.payment.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * getLatestPaymentForOrder
 *
 * Returns the most recent payment for an order.
 *
 * @param orderId - Order UUID.
 * @returns Payment or null.
 * @calledBy Checkout resume and status UI
 */
export async function getLatestPaymentForOrder(orderId: string) {
  return prisma.payment.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * listRecentPayments
 *
 * Lists recent payments across orders for reviewer/admin views.
 *
 * @param limit - Max rows; defaults to 50.
 * @returns Payment list items.
 * @calledBy Reviewer payments page
 */
export async function listRecentPayments(limit = 50) {
  return prisma.payment.findMany({
    include: paymentInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * countPaymentsByStatus
 *
 * Aggregates payment counts by status.
 *
 * @returns Status-to-count map.
 * @calledBy Reviewer payments dashboard
 */
export async function countPaymentsByStatus() {
  const groups = await prisma.payment.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts: Record<PaymentStatus, number> = {
    PENDING: 0,
    REQUIRES_ACTION: 0,
    SUCCEEDED: 0,
    FAILED: 0,
    REFUNDED: 0,
    CANCELLED: 0,
  };
  for (const row of groups) {
    counts[row.status] = row._count._all;
  }
  return counts;
}

/**
 * startCheckoutForOrder
 *
 * Creates/updates a pending payment and returns a provider checkout URL.
 *
 * @param input - orderId, buyerId, siteOrigin, redirectUrl.
 * @returns Checkout URL result or error.
 * @calledBy PayOrderButton / checkout actions
 */
export async function startCheckoutForOrder(input: {
  orderId: string;
  buyerId: string;
  buyerEmail?: string | null;
  siteOrigin: string;
}): Promise<PaymentResult> {
  const { orderId, buyerId, buyerEmail, siteOrigin } = input;

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId },
      include: { listing: { select: { title: true } } },
    });
    if (!order) {
      throw new PaymentError("Pedido no encontrado.");
    }
    if (order.buyerId !== buyerId) {
      throw new PaymentError("Solo el comprador puede pagar este pedido.");
    }
    if (order.status !== "AWAITING_PAYMENT") {
      throw new PaymentError(
        order.status === "PAID" || order.status === "COMPLETED"
          ? "Este pedido ya está pagado."
          : "Este pedido ya no se puede pagar.",
      );
    }

    const existing = await prisma.payment.findFirst({
      where: {
        orderId,
        status: { in: ["PENDING", "REQUIRES_ACTION"] },
        checkoutUrl: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing?.checkoutUrl) {
      return {
        ok: true,
        paymentId: existing.id,
        checkoutUrl: existing.checkoutUrl,
      };
    }

    const { provider, mode } = resolvePaymentProvider(siteOrigin);
    const reference = `tp_${order.id}_${Date.now().toString(36)}`;
    const redirectUrl = `${siteOrigin}/compras/${order.id}?pago=regreso`;

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        buyerId,
        provider: mode,
        status: "PENDING",
        amount: order.totalPrice,
        currency: order.currency,
        equipmentPrice: order.equipmentPrice,
        platformFee: order.platformFee,
        reference,
      },
    });

    try {
      const checkout = await provider.createCheckout({
        reference: payment.reference,
        amountPesos: order.totalPrice,
        currency: order.currency,
        description: order.listing.title,
        redirectUrl,
        customerEmail: buyerEmail,
      });

      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "REQUIRES_ACTION",
          checkoutUrl: checkout.checkoutUrl,
          providerCheckoutId: checkout.providerCheckoutId,
          providerPaymentId: checkout.providerPaymentId ?? null,
        },
      });

      return {
        ok: true,
        paymentId: updated.id,
        checkoutUrl: updated.checkoutUrl!,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al crear el checkout.";
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureMessage: message,
          failureCode: "CHECKOUT_CREATE_FAILED",
        },
      });
      throw new PaymentError(message);
    }
  } catch (error) {
    if (error instanceof PaymentError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * markPaymentSucceeded
 *
 * Marks payment SUCCEEDED, order PAID, and records Financial Core hold.
 *
 * @param input - payment reference / provider ids and amounts.
 * @returns Success or error result.
 * @calledBy Webhooks and mock confirm
 */
export async function markPaymentSucceeded(input: {
  paymentId: string;
  providerPaymentId?: string | null;
  amountPesos?: number | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { paymentId, providerPaymentId, amountPesos } = input;

  try {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id: paymentId },
        include: { order: true },
      });
      if (!payment) {
        throw new PaymentError("Pago no encontrado.");
      }
      if (payment.status === "SUCCEEDED") {
        return;
      }
      if (payment.status === "REFUNDED" || payment.status === "CANCELLED") {
        throw new PaymentError("Este pago ya no se puede confirmar.");
      }
      if (amountPesos != null && amountPesos !== payment.amount) {
        throw new PaymentError("El monto pagado no coincide con el pedido.");
      }

      const now = new Date();
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCEEDED",
          paidAt: now,
          providerPaymentId: providerPaymentId ?? payment.providerPaymentId,
          failureCode: null,
          failureMessage: null,
        },
      });

      if (payment.order.status === "AWAITING_PAYMENT") {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: "PAID",
            paidAt: now,
          },
        });

        await recordPaymentHold(tx, {
          orderId: payment.orderId,
          paymentId: payment.id,
          buyerTotal: payment.order.totalPrice,
          sellerAmountPesos:
            payment.order.sellerAmountPesos || payment.order.equipmentPrice,
          platformFee: payment.order.platformFee,
          wompiCollectionPesos: payment.order.wompiCollectionPesos,
          wompiPayoutPesos: payment.order.wompiPayoutPesos,
          truephoneRevenuePesos: payment.order.truephoneRevenuePesos,
          feeRateBps: payment.order.feeRateBps,
          currency: payment.order.currency,
        });
      }
    });

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { orderId: true, order: { select: { status: true } } },
    });
    if (payment?.order.status === "PAID") {
      await safeNotify(notifySellerOrderPaid({ orderId: payment.orderId }));
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof PaymentError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * markPaymentFailed
 *
 * Marks a payment as failed without releasing the order reservation policy.
 *
 * @param input - payment id and failure details.
 * @returns Update result.
 * @calledBy Webhooks and mock fail paths
 */
export async function markPaymentFailed(input: {
  paymentId: string;
  providerPaymentId?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
}) {
  await prisma.payment.updateMany({
    where: {
      id: input.paymentId,
      status: { in: ["PENDING", "REQUIRES_ACTION"] },
    },
    data: {
      status: "FAILED",
      providerPaymentId: input.providerPaymentId ?? undefined,
      failureCode: input.failureCode ?? "PROVIDER_DECLINED",
      failureMessage: input.failureMessage ?? "El pago fue rechazado.",
    },
  });
}

/**
 * confirmMockPayment
 *
 * Completes a mock checkout as succeeded for local/CI.
 *
 * @param input - reference and optional redirect context.
 * @returns Success redirect path or error.
 * @calledBy Mock checkout API route
 */
export async function confirmMockPayment(input: {
  reference: string;
}): Promise<{ ok: true; orderId: string } | { ok: false; error: string }> {
  const payment = await prisma.payment.findFirst({
    where: { reference: input.reference, provider: "MOCK" },
  });
  if (!payment) {
    return { ok: false, error: "Pago mock no encontrado." };
  }
  if (payment.status === "SUCCEEDED") {
    return { ok: true, orderId: payment.orderId };
  }

  const result = await markPaymentSucceeded({
    paymentId: payment.id,
    providerPaymentId: `mock_txn_${payment.id}`,
    amountPesos: payment.amount,
  });
  if (!result.ok) return result;
  return { ok: true, orderId: payment.orderId };
}

/**
 * refundPaymentForOrder
 *
 * Issues a provider refund and records ledger/payment refund state.
 *
 * @param input - orderId, amountPesos, reason, siteOrigin.
 * @returns Refund result.
 * @calledBy Financial Core cancel paths
 */
export async function refundPaymentForOrder(input: {
  orderId: string;
  siteOrigin: string;
  reason?: string | null;
  amountPesos?: number | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const payment = await prisma.payment.findFirst({
    where: { orderId: input.orderId, status: "SUCCEEDED" },
    orderBy: { createdAt: "desc" },
  });
  if (!payment) {
    return { ok: true };
  }

  const refundAmount = input.amountPesos ?? payment.amount;
  const { provider } = resolvePaymentProvider(input.siteOrigin);
  if (payment.providerPaymentId) {
    const refund = await provider.refund({
      providerPaymentId: payment.providerPaymentId,
      amountPesos: refundAmount,
      reason: input.reason,
    });
    if (!refund.ok && payment.provider === "WOMPI") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "REFUNDED",
          refundedAt: new Date(),
          refundAmount,
          failureMessage: `Reembolso manual requerido: ${refund.error}`,
        },
      });
      return { ok: true };
    }
    if (!refund.ok) {
      return { ok: false, error: refund.error };
    }
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "REFUNDED",
      refundedAt: new Date(),
      refundAmount,
    },
  });

  return { ok: true };
}

/**
 * cancelOpenPaymentsForOrder
 *
 * Cancels pending/open payment attempts for an order.
 *
 * @param orderId - Order UUID.
 * @returns void after updates.
 * @calledBy Order cancel pre-payment
 */
export async function cancelOpenPaymentsForOrder(orderId: string) {
  await prisma.payment.updateMany({
    where: {
      orderId,
      status: { in: ["PENDING", "REQUIRES_ACTION"] },
    },
    data: { status: "CANCELLED" },
  });
}

type WompiWebhookBody = {
  event?: string;
  data?: {
    transaction?: {
      id?: string;
      status?: string;
      amount_in_cents?: number;
      reference?: string;
      payment_link_id?: string | null;
      status_message?: string | null;
    };
  };
  signature?: {
    properties?: string[];
    checksum?: string;
  };
  timestamp?: number | string;
  sent_at?: string;
};

/**
 * handleWompiWebhook
 *
 * Verifies Wompi event checksum and applies payment status transitions.
 * VOIDED after a succeeded collection is ingested as a chargeback (Financial Core).
 *
 * @param input - Raw webhook body and headers/secrets.
 * @returns Handling result.
 * @calledBy Wompi webhook API route
 */
export async function handleWompiWebhook(input: {
  body: WompiWebhookBody;
  checksumHeader?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const env = getWompiEnv();
  if (!env) {
    return { ok: false, error: "Wompi no configurado.", status: 503 };
  }

  const { body, checksumHeader } = input;
  const checksum = checksumHeader || body.signature?.checksum;
  const properties = body.signature?.properties;
  const timestamp = body.timestamp;

  if (
    !checksum ||
    !properties ||
    timestamp === undefined ||
    !body.data ||
    typeof body.data !== "object"
  ) {
    return { ok: false, error: "Payload incompleto.", status: 400 };
  }

  const valid = verifyWompiEventChecksum({
    data: body.data as Record<string, unknown>,
    properties,
    timestamp,
    checksum,
    eventsSecret: env.eventsSecret,
  });
  if (!valid) {
    return { ok: false, error: "Firma inválida.", status: 401 };
  }

  const eventType = body.event || "transaction.updated";
  const externalEventKey = `${checksum}:${timestamp}`;

  const existing = await prisma.paymentWebhookEvent.findUnique({
    where: {
      provider_externalEventKey: {
        provider: "WOMPI",
        externalEventKey,
      },
    },
  });
  if (existing?.processedAt) {
    return { ok: true };
  }

  const eventRow =
    existing ??
    (await prisma.paymentWebhookEvent.create({
      data: {
        provider: "WOMPI",
        eventType,
        externalEventKey,
        payload: body as Prisma.InputJsonValue,
      },
    }));

  const tx = body.data.transaction;
  if (!tx?.id || !tx.status) {
    await prisma.paymentWebhookEvent.update({
      where: { id: eventRow.id },
      data: {
        processedAt: new Date(),
        processingError: "Sin transaction en el evento.",
      },
    });
    return { ok: true };
  }

  const payment = await findPaymentForWompiTransaction({
    providerPaymentId: tx.id,
    paymentLinkId: tx.payment_link_id,
    reference: tx.reference,
  });

  if (!payment) {
    await prisma.paymentWebhookEvent.update({
      where: { id: eventRow.id },
      data: {
        processedAt: new Date(),
        processingError: `Pago no encontrado para txn ${tx.id}.`,
      },
    });
    return { ok: true };
  }

  try {
    if (tx.status === "APPROVED") {
      const amountPesos =
        typeof tx.amount_in_cents === "number"
          ? wompiCentsToPesos(tx.amount_in_cents)
          : null;
      const result = await markPaymentSucceeded({
        paymentId: payment.id,
        providerPaymentId: tx.id,
        amountPesos,
      });
      if (!result.ok) {
        throw new Error(result.error);
      }
    } else if (
      tx.status === "DECLINED" ||
      tx.status === "ERROR" ||
      tx.status === "VOIDED"
    ) {
      if (
        tx.status === "VOIDED" &&
        (payment.status === "SUCCEEDED" || payment.status === "REFUNDED")
      ) {
        // Unexpected void after collection = chargeback / bank reversal.
        const amountPesos =
          typeof tx.amount_in_cents === "number"
            ? wompiCentsToPesos(tx.amount_in_cents)
            : undefined;
        const result = await recordChargebackReceived({
          paymentId: payment.id,
          amountPesos,
          providerReference: tx.id,
          source: "webhook",
          memo: tx.status_message || "Wompi VOIDED after collection",
        });
        if (!result.ok) {
          throw new Error(result.error);
        }
      } else {
        await markPaymentFailed({
          paymentId: payment.id,
          providerPaymentId: tx.id,
          failureCode: tx.status,
          failureMessage: tx.status_message || `Transacción ${tx.status}`,
        });
      }
    }

    await prisma.paymentWebhookEvent.update({
      where: { id: eventRow.id },
      data: {
        paymentId: payment.id,
        processedAt: new Date(),
        processingError: null,
      },
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    await prisma.paymentWebhookEvent.update({
      where: { id: eventRow.id },
      data: {
        paymentId: payment.id,
        processingError: message,
      },
    });
    return { ok: false, error: message, status: 500 };
  }
}

/**
 * findPaymentForWompiTransaction
 *
 * Locates a Payment row from Wompi transaction/reference fields.
 *
 * @param input - reference and provider transaction ids.
 * @returns Payment or null.
 * @calledBy handleWompiWebhook
 */
async function findPaymentForWompiTransaction(input: {
  providerPaymentId: string;
  paymentLinkId?: string | null;
  reference?: string | null;
}) {
  if (input.providerPaymentId) {
    const byTxn = await prisma.payment.findFirst({
      where: { providerPaymentId: input.providerPaymentId },
    });
    if (byTxn) return byTxn;
  }
  if (input.paymentLinkId) {
    const byLink = await prisma.payment.findFirst({
      where: { providerCheckoutId: input.paymentLinkId },
      orderBy: { createdAt: "desc" },
    });
    if (byLink) return byLink;
  }
  if (input.reference) {
    const byRef = await prisma.payment.findFirst({
      where: {
        OR: [
          { reference: input.reference },
          { reference: { startsWith: input.reference } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    if (byRef) return byRef;
  }
  return null;
}

export type { PaymentProvider };
