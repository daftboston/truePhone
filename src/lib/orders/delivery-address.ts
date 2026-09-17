/**
 * @file delivery-address.ts
 * @description Delivery address snapshots, change guards, and formatting for orders.
 * @dependencies @prisma/client, @/lib/locations/colombia-cities
 */

import type {
  OrderDeliveryAddressChangeStatus,
  OrderStatus,
} from "@prisma/client";

import { resolvePersistedCity } from "@/lib/locations/colombia-cities";

/** Persisted delivery fields on an order row. */
export type OrderDeliveryAddressSnapshot = {
  deliveryRecipientName: string | null;
  deliveryPhone: string | null;
  deliveryCity: string | null;
  deliveryDepartment: string | null;
  deliveryAddressLine: string | null;
  deliveryNotes: string | null;
  deliveryAddressFrozenAt: Date | null;
};

/** Input shape for saving or requesting a delivery address. */
export type DeliveryAddressInput = {
  recipientName: string;
  phone: string;
  department: string;
  cityOption: string;
  cityDetail?: string;
  addressLine: string;
  notes?: string;
};

type ShipmentGuardSnapshot = {
  method: string;
  status: string;
  trackingCode: string | null;
  trackingUploadedAt: Date | null;
  evidenceUrl: string | null;
} | null;

type ChangeGuardInput = {
  orderStatus: OrderStatus;
  deliveryAddressFrozenAt: Date | null;
  shipment: ShipmentGuardSnapshot;
  hasPendingChange: boolean;
};

/**
 * resolveDeliveryCity
 *
 * Maps department/city form fields to the persisted city string.
 *
 * @param input - Department and city option/detail from the form.
 * @returns Canonical city label stored on the order.
 * @calledBy saveDeliveryAddressDraft, requestDeliveryAddressChange
 */
export function resolveDeliveryCity(input: {
  department: string;
  cityOption: string;
  cityDetail?: string;
}) {
  return resolvePersistedCity({
    department: input.department,
    cityOption: input.cityOption,
    cityDetail: input.cityDetail ?? "",
  });
}

/**
 * isDeliveryAddressComplete
 *
 * True when all required delivery fields are present on an order snapshot.
 *
 * @param order - Order delivery columns.
 * @returns Whether checkout can proceed or the address can be frozen.
 * @calledBy startCheckoutForOrder, markPaymentSucceeded
 */
export function isDeliveryAddressComplete(
  order: OrderDeliveryAddressSnapshot,
): boolean {
  return Boolean(
    order.deliveryRecipientName?.trim() &&
    order.deliveryPhone?.trim() &&
    order.deliveryCity?.trim() &&
    order.deliveryDepartment?.trim() &&
    order.deliveryAddressLine?.trim(),
  );
}

/**
 * formatDeliveryAddressLines
 *
 * Builds Spanish display lines for buyer/seller order UI.
 *
 * @param order - Order delivery columns.
 * @returns Ordered lines for rendering, or empty when incomplete.
 * @calledBy OrderDeliveryAddressPanel
 */
export function formatDeliveryAddressLines(
  order: OrderDeliveryAddressSnapshot,
): string[] {
  if (!isDeliveryAddressComplete(order)) return [];

  const lines = [
    order.deliveryRecipientName!.trim(),
    order.deliveryPhone!.trim(),
    `${order.deliveryAddressLine!.trim()}, ${order.deliveryCity!.trim()}, ${order.deliveryDepartment!.trim()}`,
  ];

  if (order.deliveryNotes?.trim()) {
    lines.push(`Notas: ${order.deliveryNotes.trim()}`);
  }

  return lines;
}

/**
 * deliveryAddressChangeBlockedReason
 *
 * Returns a Spanish reason when a post-payment address change is not allowed.
 *
 * @param input - Order status, frozen flag, shipment snapshot, pending change.
 * @returns Block reason, or null when a change may be requested.
 * @calledBy requestDeliveryAddressChange, order UI
 */
export function deliveryAddressChangeBlockedReason(
  input: ChangeGuardInput,
): string | null {
  if (input.orderStatus !== "PAID") {
    return "Solo puedes pedir un cambio en pedidos pagados.";
  }
  if (!input.deliveryAddressFrozenAt) {
    return "La dirección aún no está fijada en este pedido.";
  }
  if (input.hasPendingChange) {
    return "Ya hay una solicitud de cambio pendiente.";
  }

  const shipment = input.shipment;
  if (!shipment) {
    return null;
  }

  if (shipment.trackingCode?.trim() || shipment.trackingUploadedAt) {
    return "No se puede cambiar: el paquete ya tiene rastreo o guía.";
  }
  if (shipment.evidenceUrl?.trim()) {
    return "No se puede cambiar: ya hay evidencia de envío registrada.";
  }
  if (shipment.method === "PREMIUM_BOGOTA") {
    return "No se puede cambiar: TruePhone Premium ya está en curso.";
  }
  if (
    shipment.status === "IN_TRANSIT" ||
    shipment.status === "DELIVERED" ||
    shipment.status === "FAILED" ||
    shipment.status === "RETURNED"
  ) {
    return "No se puede cambiar: el envío ya avanzó.";
  }

  return null;
}

/**
 * canRequestDeliveryAddressChange
 *
 * @param input - Order/shipment guard snapshot.
 * @returns True when buyer may open a change request.
 * @calledBy OrderDeliveryAddressPanel
 */
export function canRequestDeliveryAddressChange(input: ChangeGuardInput) {
  return deliveryAddressChangeBlockedReason(input) === null;
}

/**
 * snapshotFromOrder
 *
 * Copies current order delivery columns into old/new audit fields.
 *
 * @param order - Order delivery columns.
 * @returns Normalized snapshot for audit rows.
 * @calledBy requestDeliveryAddressChange
 */
export function snapshotFromOrder(order: OrderDeliveryAddressSnapshot) {
  return {
    recipientName: order.deliveryRecipientName?.trim() ?? "",
    phone: order.deliveryPhone?.trim() ?? "",
    city: order.deliveryCity?.trim() ?? "",
    department: order.deliveryDepartment?.trim() ?? "",
    addressLine: order.deliveryAddressLine?.trim() ?? "",
    notes: order.deliveryNotes?.trim() || null,
  };
}

/**
 * deliveryAddressChangeStatusLabel
 *
 * @param status - Change request status enum.
 * @returns Spanish label for UI/audit.
 * @calledBy OrderDeliveryAddressPanel
 */
export function deliveryAddressChangeStatusLabel(
  status: OrderDeliveryAddressChangeStatus,
) {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "ACCEPTED":
      return "Aceptada";
    case "REJECTED":
      return "Rechazada";
    default:
      return status;
  }
}

/**
 * formatAddressAuditBlock
 *
 * Formats old→new lines for the audit trail UI.
 *
 * @param change - Accepted/rejected change row fields.
 * @returns Multi-line Spanish summary.
 * @calledBy OrderDeliveryAddressPanel
 */
export function formatAddressAuditBlock(change: {
  oldRecipientName: string;
  oldPhone: string;
  oldCity: string;
  oldDepartment: string;
  oldAddressLine: string;
  oldNotes: string | null;
  newRecipientName: string;
  newPhone: string;
  newCity: string;
  newDepartment: string;
  newAddressLine: string;
  newNotes: string | null;
}) {
  const formatOne = (
    prefix: string,
    row: typeof change,
    kind: "old" | "new",
  ) => {
    const name = kind === "old" ? row.oldRecipientName : row.newRecipientName;
    const phone = kind === "old" ? row.oldPhone : row.newPhone;
    const line = kind === "old" ? row.oldAddressLine : row.newAddressLine;
    const city = kind === "old" ? row.oldCity : row.newCity;
    const department = kind === "old" ? row.oldDepartment : row.newDepartment;
    const notes = kind === "old" ? row.oldNotes : row.newNotes;
    const base = `${prefix}: ${name}, ${phone}, ${line}, ${city}, ${department}`;
    return notes?.trim() ? `${base}. Notas: ${notes.trim()}` : base;
  };

  return [
    formatOne("Anterior", change, "old"),
    formatOne("Nueva", change, "new"),
  ];
}
