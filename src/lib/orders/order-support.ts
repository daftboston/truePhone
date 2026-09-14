/**
 * @file order-support.ts
 * @description Classifies seller order-support options from settlement and shipping state.
 * @dependencies @/lib/financial-core/settlement-guards
 */

import { canCancelPaidOrder } from "@/lib/financial-core/settlement-guards";

export type OrderSupportSnapshot = {
  status: string;
  payoutCompletedAt: Date | null;
  payoutAuthorizedAt: Date | null;
  buyerConfirmedAt: Date | null;
  buyerConfirmDeadlineAt: Date | null;
  shipment: {
    method: string;
    status: string;
    trackingCode: string | null;
    trackingUploadedAt: Date | null;
    inspectionAt: Date | null;
    deliveredAt: Date | null;
    inspection?: { result: string } | null;
  } | null;
};

export type OrderSupportOptionAvailability = {
  allowed: boolean;
  explanation: string;
};

export type OrderSupportClassification = {
  cancellation: OrderSupportOptionAvailability;
  fulfillmentException: OrderSupportOptionAvailability;
  generalSupport: OrderSupportOptionAvailability;
  buyerDisputeHandoff: boolean;
  fulfillmentCommitted: boolean;
};

const TERMINAL_SHIPMENT_STATUSES = new Set([
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "RETURNED",
  "CANCELLED",
]);

/**
 * isFulfillmentCommitted
 *
 * Returns whether custody or carrier evidence makes a simple cancellation unsafe.
 *
 * @param shipment - Current shipment snapshot.
 * @returns True after Carrier tracking or Premium pickup/inspection commitment.
 * @calledBy classifyOrderSupportOptions, support-case Server Actions
 */
export function isFulfillmentCommitted(
  shipment: OrderSupportSnapshot["shipment"],
): boolean {
  if (!shipment) return false;

  if (shipment.method === "CARRIER") {
    return Boolean(
      shipment.trackingCode?.trim() ||
      shipment.trackingUploadedAt ||
      TERMINAL_SHIPMENT_STATUSES.has(shipment.status),
    );
  }

  if (shipment.method === "PREMIUM_BOGOTA") {
    return Boolean(
      shipment.inspectionAt ||
      shipment.inspection?.result === "PASSED" ||
      shipment.inspection?.result === "FAILED" ||
      shipment.status === "INSPECTION" ||
      TERMINAL_SHIPMENT_STATUSES.has(shipment.status),
    );
  }

  return false;
}

/**
 * classifyOrderSupportOptions
 *
 * Produces one authoritative support-option matrix for seller UI and mutations.
 *
 * @param order - Settlement and shipping state for the order.
 * @returns Availability, explanations, and post-receipt dispute handoff state.
 * @calledBy seller order detail, createOrderSupportCase
 */
export function classifyOrderSupportOptions(
  order: OrderSupportSnapshot,
): OrderSupportClassification {
  const paid = order.status === "PAID";
  const received = Boolean(
    order.shipment?.deliveredAt || order.buyerConfirmDeadlineAt,
  );
  const settlementStarted = Boolean(
    order.payoutAuthorizedAt ||
    order.payoutCompletedAt ||
    order.buyerConfirmedAt,
  );
  const fulfillmentCommitted = isFulfillmentCommitted(order.shipment);

  const cancellationAllowed =
    paid &&
    !fulfillmentCommitted &&
    canCancelPaidOrder(order) &&
    !settlementStarted;
  const fulfillmentExceptionAllowed =
    paid && fulfillmentCommitted && !received && !settlementStarted;
  const generalSupportAllowed = paid;

  return {
    cancellation: {
      allowed: cancellationAllowed,
      explanation: cancellationAllowed
        ? "Puedes solicitar la cancelación antes de entregar el iPhone al envío."
        : !paid
          ? "Esta opción aparece después de que el pago esté confirmado."
          : fulfillmentCommitted
            ? "El envío ya está comprometido. Reporta un problema con el envío."
            : "La compra ya entró en confirmación o liquidación y no puede cancelarse por esta vía.",
    },
    fulfillmentException: {
      allowed: fulfillmentExceptionAllowed,
      explanation: fulfillmentExceptionAllowed
        ? "Soporte congelará la liquidación mientras revisa el envío."
        : !paid
          ? "Esta opción aparece después de que el pago esté confirmado."
          : received || settlementStarted
            ? "Después de la recepción, el comprador debe usar «Reportar un problema» y tú puedes abrir una pregunta general."
            : "Esta opción aparece cuando el envío ya tiene seguimiento o entró en custodia de TruePhone.",
    },
    generalSupport: {
      allowed: generalSupportAllowed,
      explanation: generalSupportAllowed
        ? "Haz una pregunta sobre este pedido sin cambiar su estado."
        : "La ayuda contextual aparece cuando el pago esté confirmado.",
    },
    buyerDisputeHandoff: paid && (received || settlementStarted),
    fulfillmentCommitted,
  };
}
