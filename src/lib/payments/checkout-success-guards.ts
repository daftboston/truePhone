/**
 * @file checkout-success-guards.ts
 * @description Pure guards so payment capture cannot resurrect a cancelled order.
 * @dependencies none
 */

export const PAYMENT_ALREADY_TERMINAL_ERROR =
  "Este pago ya no se puede confirmar.";

export const PAYMENT_SUCCESS_ORDER_NOT_AWAITING_ERROR =
  "El pedido ya no está pendiente de pago. No se puede confirmar el cobro.";

export type CheckoutPaymentStatus =
  | "PENDING"
  | "REQUIRES_ACTION"
  | "SUCCEEDED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type CheckoutOrderStatus =
  "AWAITING_PAYMENT" | "PAID" | "CANCELLED" | "COMPLETED";

/**
 * paymentSuccessApplyBlocker
 *
 * Returns a Spanish error when a webhook/mock success must not mark funds held.
 * Null means capture may proceed. Idempotent SUCCEEDED is a separate result so
 * callers can no-op without treating it as a hard failure.
 *
 * Concurrent unpaid cancel used to cancel the order, republish the listing, then
 * lose to `payment.update({ where: { id } })` / `order.update({ where: { id } })`
 * with no status filter — the cancelled order flipped back to PAID and a second
 * buyer could reserve the same iPhone.
 *
 * @param input.paymentStatus - Current Payment.status.
 * @param input.orderStatus - Current Order.status.
 * @returns `already_succeeded`, `{ error }`, or null when capture may proceed.
 * @calledBy markPaymentSucceeded
 */
export function paymentSuccessApplyBlocker(input: {
  paymentStatus: string;
  orderStatus: string;
}): { kind: "already_succeeded" } | { kind: "blocked"; error: string } | null {
  if (input.paymentStatus === "SUCCEEDED") {
    return { kind: "already_succeeded" };
  }
  if (
    input.paymentStatus === "REFUNDED" ||
    input.paymentStatus === "CANCELLED"
  ) {
    return { kind: "blocked", error: PAYMENT_ALREADY_TERMINAL_ERROR };
  }
  if (input.orderStatus !== "AWAITING_PAYMENT") {
    return { kind: "blocked", error: PAYMENT_SUCCESS_ORDER_NOT_AWAITING_ERROR };
  }
  return null;
}

/**
 * paymentStatusesEligibleForSuccess
 *
 * Statuses a capture may move to SUCCEEDED. FAILED is included so a later
 * Wompi APPROVED can recover a prior DECLINED on the same Payment row.
 * CANCELLED is excluded so unpaid cancel cannot be overwritten.
 *
 * @returns Payment statuses allowed in the optimistic success update.
 * @calledBy markPaymentSucceeded
 */
export function paymentStatusesEligibleForSuccess(): Array<
  Exclude<CheckoutPaymentStatus, "SUCCEEDED" | "REFUNDED" | "CANCELLED">
> {
  return ["PENDING", "REQUIRES_ACTION", "FAILED"];
}
