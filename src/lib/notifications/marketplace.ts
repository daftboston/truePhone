/**
 * @file marketplace.ts
 * @description Phase 12 marketplace notifications: listing, identity, sale, chat, shipping, payout, listing Q&A.
 * @dependencies prisma, createNotification
 */

import { listingQaPublicHref } from "@/lib/listing-qa-access";
import { createNotification } from "@/lib/notifications/create";
import { prisma } from "@/lib/db";

/**
 * notificationSiteOrigin
 *
 * Resolves an absolute origin for email deep links when no request is present.
 *
 * @returns Site origin URL.
 * @calledBy marketplace notify helpers
 */
export function notificationSiteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * listingApprovedDedupeKey
 *
 * @param listingId - Listing UUID.
 * @returns Idempotency key.
 * @calledBy notifyListingReviewed
 */
export function listingApprovedDedupeKey(listingId: string) {
  return `listing-approved:${listingId}`;
}

/**
 * listingRejectedDedupeKey
 *
 * @param listingId - Listing UUID.
 * @returns Idempotency key.
 * @calledBy notifyListingReviewed
 */
export function listingRejectedDedupeKey(listingId: string) {
  return `listing-rejected:${listingId}`;
}

/**
 * identityApprovedDedupeKey
 *
 * @param verificationId - IdentityVerification UUID.
 * @returns Idempotency key.
 * @calledBy notifyIdentityReviewed
 */
export function identityApprovedDedupeKey(verificationId: string) {
  return `identity-approved:${verificationId}`;
}

/**
 * identityRejectedDedupeKey
 *
 * @param verificationId - IdentityVerification UUID.
 * @returns Idempotency key.
 * @calledBy notifyIdentityReviewed
 */
export function identityRejectedDedupeKey(verificationId: string) {
  return `identity-rejected:${verificationId}`;
}

/**
 * orderPaidDedupeKey
 *
 * @param orderId - Order UUID.
 * @returns Idempotency key.
 * @calledBy notifySellerOrderPaid
 */
export function orderPaidDedupeKey(orderId: string) {
  return `order-paid:${orderId}`;
}

/**
 * newMessageDedupeKey
 *
 * @param messageId - Message UUID.
 * @returns Idempotency key.
 * @calledBy notifyNewMessage
 */
export function newMessageDedupeKey(messageId: string) {
  return `new-message:${messageId}`;
}

/**
 * listingQuestionDedupeKey
 *
 * @param questionId - ListingQuestion UUID.
 * @returns Idempotency key.
 * @calledBy notifySellerNewListingQuestion
 */
export function listingQuestionDedupeKey(questionId: string) {
  return `listing-question:${questionId}`;
}

/**
 * listingAnswerDedupeKey
 *
 * @param answerId - ListingQuestionAnswer UUID.
 * @returns Idempotency key.
 * @calledBy notifyAskerQuestionAnswered
 */
export function listingAnswerDedupeKey(answerId: string) {
  return `listing-answer:${answerId}`;
}

/**
 * shippingMethodDedupeKey
 *
 * @param shipmentId - Shipment UUID.
 * @param method - Premium or carrier label.
 * @returns Idempotency key.
 * @calledBy notifyBuyerShippingMethodChosen
 */
export function shippingMethodDedupeKey(shipmentId: string, method: string) {
  return `shipping-method:${shipmentId}:${method}`;
}

/**
 * trackingUploadedDedupeKey
 *
 * @param shipmentId - Shipment UUID.
 * @param trackingCode - Carrier tracking code.
 * @returns Idempotency key.
 * @calledBy notifyBuyerTrackingUploaded
 */
export function trackingUploadedDedupeKey(
  shipmentId: string,
  trackingCode: string,
) {
  return `tracking-uploaded:${shipmentId}:${trackingCode}`;
}

/**
 * payoutSentDedupeKey
 *
 * @param orderId - Order UUID.
 * @returns Idempotency key.
 * @calledBy notifySellerPayoutSent
 */
export function payoutSentDedupeKey(orderId: string) {
  return `payout-sent:${orderId}`;
}

/**
 * safeNotify
 *
 * Runs a notification helper without failing the parent marketplace action.
 *
 * @param task - Notification promise.
 * @calledBy review, identity, payment, message, shipping, payout actions
 */
export async function safeNotify(task: Promise<unknown>) {
  try {
    await task;
  } catch (error) {
    console.error("[notifications:marketplace]", error);
  }
}

/**
 * notifyListingReviewed
 *
 * Tells the seller that a listing was approved (published) or rejected.
 *
 * @param input.listingId - Reviewed listing UUID.
 * @param input.approved - True when published.
 * @param input.rejectionReason - Seller-facing reject copy.
 * @param input.siteOrigin - Optional email origin.
 * @calledBy approveListingAction, rejectListingAction
 */
export async function notifyListingReviewed(input: {
  listingId: string;
  approved: boolean;
  rejectionReason?: string | null;
  siteOrigin?: string;
}) {
  const listing = await prisma.listing.findFirst({
    where: { id: input.listingId, deletedAt: null },
    select: { id: true, title: true, sellerId: true },
  });
  if (!listing) return { ok: true as const, skipped: true as const };

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const href = `/vender/${listing.id}`;

  if (input.approved) {
    const title = "Tu anuncio ya está publicado";
    const body = `«${listing.title}» pasó la revisión y ya es visible para compradores.`;
    return createNotification({
      userId: listing.sellerId,
      type: "LISTING_APPROVED",
      title,
      body,
      href,
      dedupeKey: listingApprovedDedupeKey(listing.id),
      siteOrigin,
      emailSubject: "TruePhone: tu anuncio está publicado",
      emailText: `${body}\n\nÁbrelo en TruePhone: ${siteOrigin.replace(/\/$/, "")}${href}`,
    });
  }

  const reason = input.rejectionReason?.trim();
  const title = "Tu anuncio necesita correcciones";
  const body = reason
    ? `Rechazamos «${listing.title}». Motivo: ${reason}`
    : `Rechazamos «${listing.title}». Revisa el motivo en tus anuncios y vuelve a enviarlo.`;
  return createNotification({
    userId: listing.sellerId,
    type: "LISTING_REJECTED",
    title,
    body,
    href,
    dedupeKey: listingRejectedDedupeKey(listing.id),
    siteOrigin,
    emailSubject: "TruePhone: corrige tu anuncio",
    emailText: `${body}\n\nCorrígelo aquí: ${siteOrigin.replace(/\/$/, "")}${href}`,
  });
}

/**
 * notifyIdentityReviewed
 *
 * Tells the seller that identity verification was approved or rejected.
 *
 * @param input.verificationId - IdentityVerification UUID.
 * @param input.approved - True when verified.
 * @param input.rejectionReason - Seller-facing reject copy.
 * @param input.siteOrigin - Optional email origin.
 * @calledBy approveIdentityVerificationAction, rejectIdentityVerificationAction
 */
export async function notifyIdentityReviewed(input: {
  verificationId: string;
  approved: boolean;
  rejectionReason?: string | null;
  siteOrigin?: string;
}) {
  const verification = await prisma.identityVerification.findUnique({
    where: { id: input.verificationId },
    select: { id: true, profileId: true },
  });
  if (!verification) return { ok: true as const, skipped: true as const };

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();

  if (input.approved) {
    const href = "/vender";
    const title = "Identidad verificada";
    const body =
      "Ya puedes publicar iPhones. Un revisor confirmó tu cédula y selfie.";
    return createNotification({
      userId: verification.profileId,
      type: "IDENTITY_APPROVED",
      title,
      body,
      href,
      dedupeKey: identityApprovedDedupeKey(verification.id),
      siteOrigin,
      emailSubject: "TruePhone: identidad verificada",
      emailText: `${body}\n\nPublica tu primer anuncio: ${siteOrigin.replace(/\/$/, "")}${href}`,
    });
  }

  const href = "/verificacion";
  const reason = input.rejectionReason?.trim();
  const title = "No pudimos verificar tu identidad";
  const body = reason
    ? `Motivo: ${reason} Vuelve a intentarlo con fotos más claras.`
    : "Revisa el motivo en Verificación y vuelve a enviar tus documentos.";
  return createNotification({
    userId: verification.profileId,
    type: "IDENTITY_REJECTED",
    title,
    body,
    href,
    dedupeKey: identityRejectedDedupeKey(verification.id),
    siteOrigin,
    emailSubject: "TruePhone: corrige tu verificación",
    emailText: `${body}\n\nÁbrelo aquí: ${siteOrigin.replace(/\/$/, "")}${href}`,
  });
}

/**
 * notifySellerOrderPaid
 *
 * Tells the seller that Compra Garantizada was collected and funds are on hold.
 *
 * @param input.orderId - Paid order UUID.
 * @param input.siteOrigin - Optional email origin.
 * @calledBy markPaymentSucceeded
 */
export async function notifySellerOrderPaid(input: {
  orderId: string;
  siteOrigin?: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      status: true,
      sellerId: true,
      listing: { select: { title: true } },
    },
  });
  if (!order || order.status !== "PAID") {
    return { ok: true as const, skipped: true as const };
  }

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const href = `/ventas/${order.id}`;
  const title = "Vendiste un iPhone";
  const body = `El comprador pagó «${order.listing.title}» con Compra Garantizada. Elige el envío para que podamos entregar.`;
  return createNotification({
    userId: order.sellerId,
    type: "ORDER_PAID",
    title,
    body,
    href,
    orderId: order.id,
    dedupeKey: orderPaidDedupeKey(order.id),
    siteOrigin,
    emailSubject: "TruePhone: tienes una venta pagada",
    emailText: `${body}\n\nAbre la venta: ${siteOrigin.replace(/\/$/, "")}${href}`,
  });
}

/**
 * notifyNewMessage
 *
 * Tells the recipient that a new on-platform message arrived.
 *
 * @param input.messageId - Message UUID.
 * @param input.listingId - Listing-scoped thread.
 * @param input.receiverId - Recipient profile UUID.
 * @param input.preview - Truncated message body.
 * @param input.siteOrigin - Optional email origin.
 * @calledBy sendMessageAction
 */
export async function notifyNewMessage(input: {
  messageId: string;
  listingId: string;
  receiverId: string;
  preview: string;
  siteOrigin?: string;
}) {
  const listing = await prisma.listing.findFirst({
    where: { id: input.listingId },
    select: { title: true },
  });
  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const href = `/mensajes/${input.listingId}`;
  const snippet = input.preview.trim().slice(0, 140);
  const title = "Nuevo mensaje";
  const body = listing ? `Sobre «${listing.title}»: ${snippet}` : snippet;
  return createNotification({
    userId: input.receiverId,
    type: "NEW_MESSAGE",
    title,
    body,
    href,
    dedupeKey: newMessageDedupeKey(input.messageId),
    siteOrigin,
    emailSubject: "TruePhone: tienes un mensaje",
    emailText: `${body}\n\nResponde en TruePhone: ${siteOrigin.replace(/\/$/, "")}${href}`,
  });
}

/**
 * notifyBuyerShippingMethodChosen
 *
 * Tells the buyer that the seller picked Premium or carrier shipping.
 *
 * @param input.orderId - Order UUID.
 * @param input.methodLabel - Spanish method name.
 * @param input.shipmentId - Shipment UUID for dedupe.
 * @param input.siteOrigin - Optional email origin.
 * @calledBy selectShippingMethodAction
 */
export async function notifyBuyerShippingMethodChosen(input: {
  orderId: string;
  methodLabel: string;
  shipmentId: string;
  siteOrigin?: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      buyerId: true,
      listing: { select: { title: true } },
    },
  });
  if (!order) return { ok: true as const, skipped: true as const };

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const href = `/compras/${order.id}`;
  const title = "El vendedor eligió el envío";
  const body = `Para «${order.listing.title}» usará ${input.methodLabel}. Te avisaremos cuando haya guía de seguimiento.`;
  return createNotification({
    userId: order.buyerId,
    type: "SHIPPING_METHOD_CHOSEN",
    title,
    body,
    href,
    orderId: order.id,
    dedupeKey: shippingMethodDedupeKey(input.shipmentId, input.methodLabel),
    siteOrigin,
    emailSubject: "TruePhone: ya hay método de envío",
    emailText: `${body}\n\nVer pedido: ${siteOrigin.replace(/\/$/, "")}${href}`,
  });
}

/**
 * notifyBuyerTrackingUploaded
 *
 * Tells the buyer that a carrier tracking code is available.
 *
 * @param input.orderId - Order UUID.
 * @param input.shipmentId - Shipment UUID.
 * @param input.carrierName - Carrier display name.
 * @param input.trackingCode - Tracking code.
 * @param input.siteOrigin - Optional email origin.
 * @calledBy uploadCarrierTrackingAction
 */
export async function notifyBuyerTrackingUploaded(input: {
  orderId: string;
  shipmentId: string;
  carrierName: string;
  trackingCode: string;
  siteOrigin?: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      buyerId: true,
      listing: { select: { title: true } },
    },
  });
  if (!order) return { ok: true as const, skipped: true as const };

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const href = `/compras/${order.id}`;
  const title = "Tu iPhone ya tiene guía";
  const body = `«${order.listing.title}» viaja con ${input.carrierName}. Código: ${input.trackingCode}.`;
  return createNotification({
    userId: order.buyerId,
    type: "TRACKING_UPLOADED",
    title,
    body,
    href,
    orderId: order.id,
    dedupeKey: trackingUploadedDedupeKey(input.shipmentId, input.trackingCode),
    siteOrigin,
    emailSubject: "TruePhone: código de seguimiento",
    emailText: `${body}\n\nVer pedido: ${siteOrigin.replace(/\/$/, "")}${href}`,
  });
}

/**
 * notifySellerPayoutSent
 *
 * Tells the seller that ops marked the Wompi payout as paid.
 *
 * @param input.orderId - Completed order UUID.
 * @param input.siteOrigin - Optional email origin.
 * @calledBy markManualPayoutCompletedAction
 */
export async function notifySellerPayoutSent(input: {
  orderId: string;
  siteOrigin?: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      sellerId: true,
      listing: { select: { title: true } },
    },
  });
  if (!order) return { ok: true as const, skipped: true as const };

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const href = `/ventas/${order.id}`;
  const title = "Ya enviamos tu pago";
  const body = `TruePhone marcó como pagada la liquidación de «${order.listing.title}». Revisa tu cuenta bancaria.`;
  return createNotification({
    userId: order.sellerId,
    type: "PAYOUT_SENT",
    title,
    body,
    href,
    orderId: order.id,
    dedupeKey: payoutSentDedupeKey(order.id),
    siteOrigin,
    emailSubject: "TruePhone: pago enviado",
    emailText: `${body}\n\nVer venta: ${siteOrigin.replace(/\/$/, "")}${href}`,
  });
}

/**
 * notifySellerNewListingQuestion
 *
 * Tells the listing owner that a public question arrived.
 *
 * @param input.questionId - ListingQuestion UUID.
 * @param input.sellerId - Listing owner profile UUID.
 * @param input.listingTitle - Listing title for copy.
 * @param input.listingSlug - Public listing slug.
 * @param input.preview - Truncated question body.
 * @param input.siteOrigin - Optional email origin.
 * @calledBy askListingQuestionAction
 */
export async function notifySellerNewListingQuestion(input: {
  questionId: string;
  sellerId: string;
  listingTitle: string;
  listingSlug: string;
  preview: string;
  siteOrigin?: string;
}) {
  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const href = listingQaPublicHref(input.listingSlug);
  const snippet = input.preview.trim().slice(0, 140);
  const title = `Nueva pregunta en ${input.listingTitle}`;
  const body = snippet;
  return createNotification({
    userId: input.sellerId,
    type: "LISTING_QUESTION_NEW",
    title,
    body,
    href,
    dedupeKey: listingQuestionDedupeKey(input.questionId),
    siteOrigin,
    emailSubject: "TruePhone: nueva pregunta en tu anuncio",
    emailText: `${body}\n\nResponde en TruePhone: ${siteOrigin.replace(/\/$/, "")}${href}`,
  });
}

/**
 * notifyAskerQuestionAnswered
 *
 * Tells the asker that the seller posted an official answer.
 *
 * @param input.answerId - ListingQuestionAnswer UUID.
 * @param input.askerId - Question author profile UUID.
 * @param input.listingTitle - Listing title for copy.
 * @param input.listingSlug - Public listing slug.
 * @param input.siteOrigin - Optional email origin.
 * @calledBy answerListingQuestionAction
 */
export async function notifyAskerQuestionAnswered(input: {
  answerId: string;
  askerId: string;
  listingTitle: string;
  listingSlug: string;
  siteOrigin?: string;
}) {
  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const href = listingQaPublicHref(input.listingSlug);
  const title = "El vendedor respondió tu pregunta";
  const body = `Hay una respuesta oficial en «${input.listingTitle}».`;
  return createNotification({
    userId: input.askerId,
    type: "LISTING_QUESTION_ANSWERED",
    title,
    body,
    href,
    dedupeKey: listingAnswerDedupeKey(input.answerId),
    siteOrigin,
    emailSubject: "TruePhone: respondieron tu pregunta",
    emailText: `${body}\n\nVer respuesta: ${siteOrigin.replace(/\/$/, "")}${href}`,
  });
}
