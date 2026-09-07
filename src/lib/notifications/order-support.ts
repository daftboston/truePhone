/**
 * @file order-support.ts
 * @description Idempotent notifications for order-support replies, decisions, buyer remedy, and refunds.
 * @dependencies prisma, createNotification, email-template, marketplace notification helpers
 */

import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications/create";
import { buildNotificationEmail } from "@/lib/notifications/email-template";
import { notificationSiteOrigin } from "@/lib/notifications/marketplace";

/**
 * orderSupportReplyDedupeKey
 *
 * Builds a stable key for one direction of one support message.
 *
 * @param direction - Staff-to-seller or seller-to-staff delivery.
 * @param messageId - Durable message UUID.
 * @returns Notification dedupe key.
 * @calledBy order-support reply notification helpers and tests
 */
export function orderSupportReplyDedupeKey(
  direction: "staff" | "seller",
  messageId: string,
) {
  return `order-support-${direction}-reply:${messageId}`;
}

/**
 * orderSupportStatusDedupeKey
 *
 * Builds a stable key for one persisted case transition.
 *
 * @param caseId - Support case UUID.
 * @param eventKey - Persisted transition timestamp key.
 * @returns Notification dedupe key.
 * @calledBy notifySellerOrderSupportStatus and tests
 */
export function orderSupportStatusDedupeKey(caseId: string, eventKey: string) {
  return `order-support-status:${caseId}:${eventKey}`;
}

/**
 * notifySellerOrderSupportReply
 *
 * Notifies the seller about one public staff reply.
 *
 * @param input.caseId - Support case UUID.
 * @param input.messageId - Public support message UUID used for dedupe.
 * @param input.preview - Truncated reply text.
 * @param input.siteOrigin - Optional absolute origin for email.
 * @returns Notification result or skipped marker.
 * @calledBy staffOrderSupportMessageAction
 */
export async function notifySellerOrderSupportReply(input: {
  caseId: string;
  messageId: string;
  preview: string;
  siteOrigin?: string;
}) {
  const supportCase = await prisma.orderSupportCase.findUnique({
    where: { id: input.caseId },
    select: { sellerId: true, orderId: true },
  });
  if (!supportCase) return { ok: true as const, skipped: true as const };

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const href = `/ventas/${supportCase.orderId}`;
  const title = "Soporte respondió tu solicitud";
  const body = input.preview.trim().slice(0, 160);
  return createNotification({
    userId: supportCase.sellerId,
    type: "ORDER_SUPPORT_REPLY",
    title,
    body,
    href,
    orderId: supportCase.orderId,
    dedupeKey: orderSupportReplyDedupeKey("staff", input.messageId),
    siteOrigin,
    ...buildNotificationEmail({
      subject: "TruePhone: soporte respondió tu solicitud",
      title,
      body,
      siteOrigin,
      href,
      ctaLabel: "Ver solicitud",
    }),
  });
}

/**
 * notifyAssignedStaffOrderSupportReply
 *
 * Notifies the assigned staff member about one seller reply.
 *
 * @param input.caseId - Support case UUID.
 * @param input.messageId - Seller message UUID used for dedupe.
 * @param input.staffId - Assigned REVIEWER/ADMIN profile UUID.
 * @param input.orderId - Affected order UUID.
 * @param input.preview - Truncated seller reply.
 * @param input.siteOrigin - Optional absolute origin for email.
 * @returns Notification result.
 * @calledBy replyToOrderSupportCaseAction
 */
export async function notifyAssignedStaffOrderSupportReply(input: {
  caseId: string;
  messageId: string;
  staffId: string;
  orderId: string;
  preview: string;
  siteOrigin?: string;
}) {
  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const href = `/revision/soporte-pedidos/${input.caseId}`;
  const title = "El vendedor respondió";
  const body = input.preview.trim().slice(0, 160);
  return createNotification({
    userId: input.staffId,
    type: "ORDER_SUPPORT_REPLY",
    title,
    body,
    href,
    orderId: input.orderId,
    dedupeKey: orderSupportReplyDedupeKey("seller", input.messageId),
    siteOrigin,
    ...buildNotificationEmail({
      subject: "TruePhone: el vendedor respondió en soporte",
      title,
      body,
      siteOrigin,
      href,
      ctaLabel: "Abrir caso",
    }),
  });
}

/**
 * notifySellerOrderSupportStatus
 *
 * Notifies the seller when staff changes the workflow status.
 *
 * @param input.caseId - Support case UUID.
 * @param input.status - Localized status summary.
 * @param input.eventKey - Stable transition key used for dedupe.
 * @param input.siteOrigin - Optional absolute origin for email.
 * @returns Notification result or skipped marker.
 * @calledBy staffOrderSupportDecisionAction
 */
export async function notifySellerOrderSupportStatus(input: {
  caseId: string;
  status: string;
  eventKey: string;
  siteOrigin?: string;
}) {
  const supportCase = await prisma.orderSupportCase.findUnique({
    where: { id: input.caseId },
    select: { sellerId: true, orderId: true },
  });
  if (!supportCase) return { ok: true as const, skipped: true as const };

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const href = `/ventas/${supportCase.orderId}`;
  const title = "Actualizamos tu solicitud";
  const body = input.status;
  return createNotification({
    userId: supportCase.sellerId,
    type: "ORDER_SUPPORT_STATUS",
    title,
    body,
    href,
    orderId: supportCase.orderId,
    dedupeKey: orderSupportStatusDedupeKey(input.caseId, input.eventKey),
    siteOrigin,
    ...buildNotificationEmail({
      subject: "TruePhone: actualizamos tu solicitud",
      title,
      body,
      siteOrigin,
      href,
      ctaLabel: "Ver solicitud",
    }),
  });
}

/**
 * notifyAcceptedSellerCancellation
 *
 * Notifies both parties after an approved cancellation and exposes the buyer remedy.
 *
 * @param input.orderId - Cancelled source order.
 * @param input.caseId - Approved support case for dedupe.
 * @param input.siteOrigin - Optional absolute origin for email.
 * @returns Seller and buyer notification results.
 * @calledBy staffOrderSupportDecisionAction
 */
export async function notifyAcceptedSellerCancellation(input: {
  orderId: string;
  caseId: string;
  siteOrigin?: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      listing: { select: { title: true } },
    },
  });
  if (!order) return { ok: true as const, skipped: true as const };

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const sellerTitle = "Cancelación aceptada";
  const sellerBody = `Archivamos «${order.listing.title}». El pedido conserva el historial para soporte.`;
  const sellerHref = `/ventas/${order.id}`;
  const buyerTitle = "El vendedor canceló tu compra";
  const buyerBody =
    "Elige una compra de reemplazo con protección del 8% o solicita el reembolso total.";
  const buyerHref = `/compras/${order.id}`;
  const [seller, buyer] = await Promise.all([
    createNotification({
      userId: order.sellerId,
      type: "SELLER_CANCELLATION_ACCEPTED",
      title: sellerTitle,
      body: sellerBody,
      href: sellerHref,
      orderId: order.id,
      dedupeKey: `seller-cancellation-accepted:${input.caseId}`,
      siteOrigin,
      ...buildNotificationEmail({
        subject: "TruePhone: cancelación aceptada",
        title: sellerTitle,
        body: sellerBody,
        siteOrigin,
        href: sellerHref,
        ctaLabel: "Ver venta",
      }),
    }),
    createNotification({
      userId: order.buyerId,
      type: "BUYER_REMEDY_AVAILABLE",
      title: buyerTitle,
      body: buyerBody,
      href: buyerHref,
      orderId: order.id,
      dedupeKey: `buyer-remedy-available:${input.caseId}`,
      siteOrigin,
      ...buildNotificationEmail({
        subject: "TruePhone: elige reembolso o 8%",
        title: buyerTitle,
        body: buyerBody,
        siteOrigin,
        href: buyerHref,
        ctaLabel: "Elegir opción",
      }),
    }),
  ]);
  return { ok: true as const, seller, buyer };
}

/**
 * notifyBuyerRefundCompleted
 *
 * Confirms that the seller-abandon refund was recorded.
 *
 * @param input.orderId - Refunded cancelled order.
 * @param input.siteOrigin - Optional absolute origin for email.
 * @returns Notification result or skipped marker.
 * @calledBy chooseRefundAfterSellerAbandonAction
 */
export async function notifyBuyerRefundCompleted(input: {
  orderId: string;
  siteOrigin?: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { buyerId: true },
  });
  if (!order) return { ok: true as const, skipped: true as const };

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const href = `/compras/${input.orderId}`;
  const title = "Reembolso procesado";
  const body =
    "Registramos el reembolso total. El tiempo para verlo depende de tu medio de pago.";
  return createNotification({
    userId: order.buyerId,
    type: "REFUND_COMPLETED",
    title,
    body,
    href,
    orderId: input.orderId,
    dedupeKey: `seller-cancellation-refund:${input.orderId}`,
    siteOrigin,
    ...buildNotificationEmail({
      subject: "TruePhone: reembolso procesado",
      title,
      body,
      siteOrigin,
      href,
      ctaLabel: "Ver pedido",
    }),
  });
}

/**
 * notifyFulfillmentEscalated
 *
 * Notifies the seller when an exception moves to ADMIN financial review.
 *
 * @param input.caseId - Escalated support case.
 * @param input.siteOrigin - Optional absolute origin for email.
 * @returns Notification result or skipped marker.
 * @calledBy staffOrderSupportDecisionAction
 */
export async function notifyFulfillmentEscalated(input: {
  caseId: string;
  siteOrigin?: string;
}) {
  const supportCase = await prisma.orderSupportCase.findUnique({
    where: { id: input.caseId },
    select: { sellerId: true, orderId: true },
  });
  if (!supportCase) return { ok: true as const, skipped: true as const };

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const href = `/ventas/${supportCase.orderId}`;
  const title = "Escalamos el problema de envío";
  const body =
    "Un administrador revisará la custodia y el resultado financiero. El pago sigue congelado.";
  return createNotification({
    userId: supportCase.sellerId,
    type: "FULFILLMENT_ESCALATED",
    title,
    body,
    href,
    orderId: supportCase.orderId,
    dedupeKey: `fulfillment-escalated:${input.caseId}`,
    siteOrigin,
    ...buildNotificationEmail({
      subject: "TruePhone: escalamos el problema de envío",
      title,
      body,
      siteOrigin,
      href,
      ctaLabel: "Ver venta",
    }),
  });
}
