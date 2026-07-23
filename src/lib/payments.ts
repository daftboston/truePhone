import {
  Prisma,
  type OrderStatus,
  type PaymentProvider,
  type PaymentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db";
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

export function isOrderAwaitingPayment(status: OrderStatus) {
  return status === "AWAITING_PAYMENT";
}

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

export async function listPaymentsForOrder(orderId: string) {
  return prisma.payment.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLatestPaymentForOrder(orderId: string) {
  return prisma.payment.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listRecentPayments(limit = 50) {
  return prisma.payment.findMany({
    include: paymentInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

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
 * Start (or resume) checkout for an AWAITING_PAYMENT order.
 * Charges the snapshotted total (equipment + 6% protection fee).
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
 * Apply a successful charge to payment + order (idempotent).
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
      }
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof PaymentError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

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
 * Confirm a mock checkout (local / CI only).
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
 * Refund a succeeded payment and release the order when cancelling a paid reserve.
 */
export async function refundPaymentForOrder(input: {
  orderId: string;
  siteOrigin: string;
  reason?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const payment = await prisma.payment.findFirst({
    where: { orderId: input.orderId, status: "SUCCEEDED" },
    orderBy: { createdAt: "desc" },
  });
  if (!payment) {
    return { ok: true };
  }

  const { provider } = resolvePaymentProvider(input.siteOrigin);
  if (payment.providerPaymentId) {
    const refund = await provider.refund({
      providerPaymentId: payment.providerPaymentId,
      amountPesos: payment.amount,
      reason: input.reason,
    });
    if (!refund.ok && payment.provider === "WOMPI") {
      // Still mark locally if void fails after settlement — ops can reconcile.
      // Prefer failing closed for MOCK; for Wompi record refund with note.
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "REFUNDED",
          refundedAt: new Date(),
          refundAmount: payment.amount,
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
      refundAmount: payment.amount,
    },
  });

  return { ok: true };
}

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
 * Persist + process a Wompi `transaction.updated` webhook (idempotent).
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
      if (tx.status === "VOIDED" && payment.status === "SUCCEEDED") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "REFUNDED",
            refundedAt: new Date(),
            refundAmount: payment.amount,
            providerPaymentId: tx.id,
          },
        });
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
