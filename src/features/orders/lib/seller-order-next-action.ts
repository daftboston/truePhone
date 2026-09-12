/**
 * @file seller-order-next-action.ts
 * @description Picks the single next seller action on a paid order.
 * @dependencies none
 */

export type SellerOrderNextAction = {
  href: string;
  label: string;
};

type SellerOrderNextActionInput = {
  status: string;
  needsBankAccount: boolean;
  payoutCompletedAt: Date | null;
  shipment: {
    method: string;
    trackingCode: string | null;
  } | null;
};

/**
 * sellerOrderNextAction
 *
 * Bank destination first, then shipping method, then carrier tracking.
 *
 * @param input - Paid-order seller state.
 * @returns Primary CTA, or null when no seller next step.
 * @calledBy OrderDetailView
 */
export function sellerOrderNextAction(
  input: SellerOrderNextActionInput,
): SellerOrderNextAction | null {
  if (input.status !== "PAID") return null;

  if (input.needsBankAccount && !input.payoutCompletedAt) {
    return { href: "/pagos", label: "Agrega tu cuenta" };
  }

  if (!input.shipment) {
    return { href: "#envio", label: "Elige el envío" };
  }

  if (
    input.shipment.method === "CARRIER" &&
    !input.shipment.trackingCode?.trim()
  ) {
    return { href: "#envio", label: "Sube el seguimiento" };
  }

  return null;
}
