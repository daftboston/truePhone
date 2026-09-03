/**
 * @file order-support.ts
 * @description Idempotent notifications for order-support replies, decisions, buyer remedy, and refunds.
 * @dependencies prisma, createNotification, marketplace notification helpers
 */

import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications/create";
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

  return createNotification({
    userId: supportCase.sellerId,
    type: "ORDER_SUPPORT_REPLY",
    title: "Soporte respondió tu solicitud",
    body: input.preview.trim().slice(0, 160),
    href: `/ventas/${supportCase.orderId}`,
    orderId: supportCase.orderId,
    dedupeKey: orderSupportReplyDedupeKey("staff", input.messageId),
    siteOrigin: input.siteOrigin ?? notificationSiteOrigin(),
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
  return createNotification({
    userId: input.staffId,
    type: "ORDER_SUPPORT_REPLY",
    title: "El vendedor respondió",
    body: input.preview.trim().slice(0, 160),
    href: `/revision/soporte-pedidos/${input.caseId}`,
    orderId: input.orderId,
    dedupeKey: orderSupportReplyDedupeKey("seller", input.messageId),
    siteOrigin: input.siteOrigin ?? notificationSiteOrigin(),
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

  return createNotification({
    userId: supportCase.sellerId,
    type: "ORDER_SUPPORT_STATUS",
    title: "Actualizamos tu solicitud",
    body: input.status,
    href: `/ventas/${supportCase.orderId}`,
    orderId: supportCase.orderId,
    dedupeKey: orderSupportStatusDedupeKey(input.caseId, input.eventKey),
    siteOrigin: input.siteOrigin ?? notificationSiteOrigin(),
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
  const [seller, buyer] = await Promise.all([
    createNotification({
      userId: order.sellerId,
      type: "SELLER_CANCELLATION_ACCEPTED",
      title: "Cancelación aceptada",
      body: `Archivamos «${order.listing.title}». El pedido conserva el historial para soporte.`,
      href: `/ventas/${order.id}`,
      orderId: order.id,
      dedupeKey: `seller-cancellation-accepted:${input.caseId}`,
      siteOrigin,
    }),
    createNotification({
      userId: order.buyerId,
      type: "BUYER_REMEDY_AVAILABLE",
      title: "El vendedor canceló tu compra",
      body: "Elige una compra de reemplazo con protección del 8% o solicita el reembolso total.",
      href: `/compras/${order.id}`,
      orderId: order.id,
      dedupeKey: `buyer-remedy-available:${input.caseId}`,
      siteOrigin,
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

  return createNotification({
    userId: order.buyerId,
    type: "REFUND_COMPLETED",
    title: "Reembolso procesado",
    body: "Registramos el reembolso total. El tiempo para verlo depende de tu medio de pago.",
    href: `/compras/${input.orderId}`,
    orderId: input.orderId,
    dedupeKey: `seller-cancellation-refund:${input.orderId}`,
    siteOrigin: input.siteOrigin ?? notificationSiteOrigin(),
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

  return createNotification({
    userId: supportCase.sellerId,
    type: "FULFILLMENT_ESCALATED",
    title: "Escalamos el problema de envío",
    body: "Un administrador revisará la custodia y el resultado financiero. El pago sigue congelado.",
    href: `/ventas/${supportCase.orderId}`,
    orderId: supportCase.orderId,
    dedupeKey: `fulfillment-escalated:${input.caseId}`,
    siteOrigin: input.siteOrigin ?? notificationSiteOrigin(),
  });
}
