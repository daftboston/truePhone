/**
 * @file settlement-guards.ts
 * @description Pure Financial Core guards so cancel/refund cannot race with seller payout.
 * @dependencies none
 */

export type PaidOrderCancelSnapshot = {
  payoutCompletedAt: Date | null;
  payoutAuthorizedAt: Date | null;
  buyerConfirmedAt: Date | null;
  buyerConfirmDeadlineAt: Date | null;
};

export type ManualPayoutOrderSnapshot = {
  status: string;
  payoutFrozen: boolean;
  payoutCompletedAt: Date | null;
};

/**
 * canCancelPaidOrder
 *
 * Returns true when a PAID order is still in the pre-receipt cancel window.
 * Once the buyer marks «Ya recibí», payout is authorized, or payout completed,
 * cancel+refund would fight settlement (buyer refund + seller payout).
 *
 * @param order - Settlement timestamps on the order.
 * @returns True when Financial Core may still authorize a cancel refund.
 * @calledBy authorizeCancelMoney, OrderDetailView
 */
export function canCancelPaidOrder(order: PaidOrderCancelSnapshot): boolean {
  return (
    !order.payoutCompletedAt &&
    !order.payoutAuthorizedAt &&
    !order.buyerConfirmedAt &&
    !order.buyerConfirmDeadlineAt
  );
}

export const PAID_ORDER_CANCEL_BLOCKED_ERROR =
  "Ya no puedes cancelar este pedido. Si el iPhone no coincide, reporta un problema para congelar el pago al vendedor.";

/**
 * manualPayoutCompletionBlocker
 *
 * Returns a Spanish error when ops must not mark a manual payout completed.
 * Null means the completion path may proceed (or is already completed).
 *
 * @param order - Order status, freeze flag, and payoutCompletedAt.
 * @returns Error message or null.
 * @calledBy confirmManualPayoutCompleted
 */
export function manualPayoutCompletionBlocker(
  order: ManualPayoutOrderSnapshot,
): string | null {
  if (order.payoutCompletedAt) {
    return null;
  }
  if (order.status !== "PAID") {
    return "El pedido ya no está en custodia. No se puede marcar como pagado.";
  }
  if (order.payoutFrozen) {
    return "El pago está congelado (disputa o reclamo). No se puede marcar como pagado.";
  }
  return null;
}
