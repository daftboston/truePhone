/**
 * @file review-wait-copy.ts
 * @description Shared seller-facing wait copy after listing or KYC submit.
 * @dependencies none
 */

/** Honest launch-stage estimate. Not a contractual SLA. */
export const MANUAL_REVIEW_ETA =
  "Revisamos en orden de llegada, normalmente el mismo día hábil.";

/**
 * listingSubmittedDescription
 *
 * Confirmation copy after a seller submits a listing for review.
 *
 * @returns Spanish EmptyState description with ETA and notify channel.
 * @calledBy ListingSubmittedPage, SellerListingSummary
 */
export function listingSubmittedDescription(): string {
  return `Un revisor de TruePhone validará las fotos, el IMEI y la prueba de posesión. ${MANUAL_REVIEW_ETA} Te avisamos por correo y en Notificaciones cuando haya una decisión.`;
}

/**
 * listingPendingReviewDescription
 *
 * Status line while a submitted listing is still in the reviewer queue.
 *
 * @returns Spanish status description with ETA and notify channel.
 * @calledBy SellerListingSummary
 */
export function listingPendingReviewDescription(): string {
  return `Un revisor de TruePhone está validando las fotos, el IMEI y la prueba de posesión. ${MANUAL_REVIEW_ETA} Te avisamos por correo y en Notificaciones.`;
}

/**
 * kycSubmittedDescription
 *
 * Confirmation copy after identity documents are sent for review.
 *
 * @returns Spanish EmptyState description with ETA and notify channel.
 * @calledBy VerificationSubmittedPage
 */
export function kycSubmittedDescription(): string {
  return `Un revisor de TruePhone confirmará tu identidad. ${MANUAL_REVIEW_ETA} Te avisamos por correo y en Notificaciones cuando puedas publicar anuncios.`;
}
