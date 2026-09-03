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
 * Spanish error when a seller tries to self-cancel a PAID order.
 * Paid seller-abandon goes through support / ops (not in-app self-cancel).
 */
export const SELLER_PAID_SELF_CANCEL_BLOCKED_ERROR =
  "Tras el pago no puedes cancelar el pedido de inmediato. Abre «Contactar soporte» en la venta para enviar una solicitud al equipo.";

/**
 * sellerPaidSelfCancelBlocker
 *
 * Returns a Spanish error when the seller must not self-cancel a PAID order.
 * Null when cancel may proceed (unpaid, buyer actor, or ops seller-abandon).
 *
 * @param input.orderStatus - Current order status.
 * @param input.actorId - Profile UUID attempting cancel.
 * @param input.sellerId - Order seller profile UUID.
 * @param input.asOpsSellerAbandon - When true, ops is cancelling as seller abandon (caller gates REVIEWER/ADMIN).
 * @returns Error message or null.
 * @calledBy authorizeCancelMoney, cancelOrder
 */
export function sellerPaidSelfCancelBlocker(input: {
  orderStatus: string;
  actorId: string;
  sellerId: string;
  asOpsSellerAbandon?: boolean;
}): string | null {
  if (input.asOpsSellerAbandon) {
    return null;
  }
  if (input.orderStatus !== "PAID") {
    return null;
  }
  if (input.actorId !== input.sellerId) {
    return null;
  }
  return SELLER_PAID_SELF_CANCEL_BLOCKED_ERROR;
}

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
