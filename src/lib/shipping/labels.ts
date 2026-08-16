/**
 * @file labels.ts
 * @description Spanish display labels for shipping methods, statuses, and inspections.
 * @dependencies @prisma/client enums
 */

import type {
  InspectionResult,
  ShipmentStatus,
  ShippingMethod,
} from "@prisma/client";

export const CARRIER_OPTIONS = [
  "Servientrega",
  "Envía",
  "Interrapidisimo",
  "Coordinadora",
  "Otro",
] as const;

export type CarrierOption = (typeof CARRIER_OPTIONS)[number];

/**
 * shippingMethodLabel
 *
 * Maps ShippingMethod enum to Spanish UI label.
 *
 * @param method - PREMIUM_BOGOTA or CARRIER.
 * @returns Localized method name.
 * @calledBy Order shipping panels
 */
export function shippingMethodLabel(method: ShippingMethod) {
  switch (method) {
    case "PREMIUM_BOGOTA":
      return "TruePhone Premium (Bogotá)";
    case "CARRIER":
      return "Transportadora";
    default:
      return method;
  }
}

/**
 * shipmentStatusLabel
 *
 * Maps ShipmentStatus enum to Spanish UI label.
 *
 * @param status - Shipment status enum value.
 * @returns Localized status text.
 * @calledBy Order shipping timeline UI
 */
export function shipmentStatusLabel(status: ShipmentStatus) {
  switch (status) {
    case "METHOD_SELECTED":
      return "Método elegido";
    case "AWAITING_PICKUP":
      return "Recogida pendiente";
    case "INSPECTION":
      return "En inspección";
    case "IN_TRANSIT":
      return "En tránsito";
    case "DELIVERED":
      return "Entregado";
    case "FAILED":
      return "Envío fallido";
    case "RETURNED":
      return "Devuelto";
    default:
      return status;
  }
}

/**
 * inspectionResultLabel
 *
 * Maps InspectionResult enum to Spanish UI label.
 *
 * @param result - Premium inspection result.
 * @returns Localized result text.
 * @calledBy Premium shipping inspection UI
 */
export function inspectionResultLabel(result: InspectionResult) {
  switch (result) {
    case "PENDING":
      return "Pendiente";
    case "PASSED":
      return "Aprobada";
    case "FAILED":
      return "Rechazada";
    default:
      return result;
  }
}
