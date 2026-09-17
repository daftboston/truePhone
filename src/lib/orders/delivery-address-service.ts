/**
 * @file delivery-address-service.ts
 * @description Mutations for order delivery address draft, freeze, and change workflow.
 * @dependencies @prisma/client, @/lib/db, @/lib/orders/delivery-address
 */

import { prisma } from "@/lib/db";
import {
  canRequestDeliveryAddressChange,
  deliveryAddressChangeBlockedReason,
  isDeliveryAddressComplete,
  resolveDeliveryCity,
  snapshotFromOrder,
  type DeliveryAddressInput,
} from "@/lib/orders/delivery-address";

class DeliveryAddressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeliveryAddressError";
  }
}

/**
 * saveDeliveryAddressDraft
 *
 * Stores editable delivery fields on an AWAITING_PAYMENT order before checkout.
 *
 * @param input - Buyer id, order id, and address fields.
 * @returns Success or Spanish error.
 * @calledBy startCheckoutForOrder
 */
export async function saveDeliveryAddressDraft(input: {
  orderId: string;
  buyerId: string;
  address: DeliveryAddressInput;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const city = resolveDeliveryCity(input.address);
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: input.orderId },
        select: {
          buyerId: true,
          status: true,
          deliveryAddressFrozenAt: true,
        },
      });
      if (!order) {
        throw new DeliveryAddressError("Pedido no encontrado.");
      }
      if (order.buyerId !== input.buyerId) {
        throw new DeliveryAddressError(
          "Solo el comprador puede editar la dirección.",
        );
      }
      if (order.status !== "AWAITING_PAYMENT") {
        throw new DeliveryAddressError(
          "La dirección ya no se puede editar en este pedido.",
        );
      }
      if (order.deliveryAddressFrozenAt) {
        throw new DeliveryAddressError(
          "La dirección de entrega ya está fijada.",
        );
      }

      await tx.order.update({
        where: { id: input.orderId },
        data: {
          deliveryRecipientName: input.address.recipientName.trim(),
          deliveryPhone: input.address.phone.trim(),
          deliveryDepartment: input.address.department.trim(),
          deliveryCity: city,
          deliveryAddressLine: input.address.addressLine.trim(),
          deliveryNotes: input.address.notes?.trim() || null,
        },
      });
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof DeliveryAddressError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * freezeDeliveryAddressOnPayment
 *
 * Sets deliveryAddressFrozenAt when payment succeeds and address is complete.
 *
 * @param tx - Prisma transaction client.
 * @param orderId - Order being marked PAID.
 * @param now - Payment timestamp.
 * @calledBy markPaymentSucceeded
 */
export async function freezeDeliveryAddressOnPayment(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  orderId: string,
  now: Date,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      deliveryRecipientName: true,
      deliveryPhone: true,
      deliveryCity: true,
      deliveryDepartment: true,
      deliveryAddressLine: true,
      deliveryNotes: true,
      deliveryAddressFrozenAt: true,
    },
  });
  if (!order || order.deliveryAddressFrozenAt) return;
  if (!isDeliveryAddressComplete(order)) {
    throw new DeliveryAddressError(
      "Falta la dirección de entrega para confirmar el pago.",
    );
  }

  await tx.order.update({
    where: { id: orderId },
    data: { deliveryAddressFrozenAt: now },
  });
}

/**
 * requestDeliveryAddressChange
 *
 * Creates a pending change row with old/new audit snapshots.
 *
 * @param input - Buyer id, order id, proposed address.
 * @returns Success or Spanish error.
 * @calledBy requestDeliveryAddressChangeAction
 */
export async function requestDeliveryAddressChange(input: {
  orderId: string;
  buyerId: string;
  address: DeliveryAddressInput;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const city = resolveDeliveryCity(input.address);
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: input.orderId },
        include: {
          shipment: {
            select: {
              method: true,
              status: true,
              trackingCode: true,
              trackingUploadedAt: true,
              evidenceUrl: true,
            },
          },
          deliveryAddressChanges: {
            where: { status: "PENDING" },
            take: 1,
          },
        },
      });
      if (!order) {
        throw new DeliveryAddressError("Pedido no encontrado.");
      }
      if (order.buyerId !== input.buyerId) {
        throw new DeliveryAddressError(
          "Solo el comprador puede pedir un cambio.",
        );
      }

      const blockReason = deliveryAddressChangeBlockedReason({
        orderStatus: order.status,
        deliveryAddressFrozenAt: order.deliveryAddressFrozenAt,
        shipment: order.shipment,
        hasPendingChange: order.deliveryAddressChanges.length > 0,
      });
      if (blockReason) {
        throw new DeliveryAddressError(blockReason);
      }
      if (
        !canRequestDeliveryAddressChange({
          orderStatus: order.status,
          deliveryAddressFrozenAt: order.deliveryAddressFrozenAt,
          shipment: order.shipment,
          hasPendingChange: order.deliveryAddressChanges.length > 0,
        })
      ) {
        throw new DeliveryAddressError("No se puede pedir el cambio ahora.");
      }

      const current = snapshotFromOrder(order);
      const next = {
        recipientName: input.address.recipientName.trim(),
        phone: input.address.phone.trim(),
        city,
        department: input.address.department.trim(),
        addressLine: input.address.addressLine.trim(),
        notes: input.address.notes?.trim() || null,
      };

      if (
        current.recipientName === next.recipientName &&
        current.phone === next.phone &&
        current.city === next.city &&
        current.department === next.department &&
        current.addressLine === next.addressLine &&
        (current.notes ?? "") === (next.notes ?? "")
      ) {
        throw new DeliveryAddressError(
          "La dirección propuesta es igual a la actual.",
        );
      }

      await tx.orderDeliveryAddressChange.create({
        data: {
          orderId: order.id,
          requestedById: input.buyerId,
          oldRecipientName: current.recipientName,
          oldPhone: current.phone,
          oldCity: current.city,
          oldDepartment: current.department,
          oldAddressLine: current.addressLine,
          oldNotes: current.notes,
          newRecipientName: next.recipientName,
          newPhone: next.phone,
          newCity: next.city,
          newDepartment: next.department,
          newAddressLine: next.addressLine,
          newNotes: next.notes,
        },
      });
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof DeliveryAddressError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * respondDeliveryAddressChange
 *
 * Seller accepts or rejects a pending buyer change request.
 *
 * @param input - Seller id, change id, decision.
 * @returns Success or Spanish error.
 * @calledBy respondDeliveryAddressChangeAction
 */
export async function respondDeliveryAddressChange(input: {
  changeId: string;
  sellerId: string;
  decision: "accept" | "reject";
}): Promise<{ ok: true; orderId: string } | { ok: false; error: string }> {
  try {
    let orderId = "";
    await prisma.$transaction(async (tx) => {
      const change = await tx.orderDeliveryAddressChange.findUnique({
        where: { id: input.changeId },
        include: {
          order: {
            include: {
              shipment: {
                select: {
                  method: true,
                  status: true,
                  trackingCode: true,
                  trackingUploadedAt: true,
                  evidenceUrl: true,
                },
              },
            },
          },
        },
      });
      if (!change || change.status !== "PENDING") {
        throw new DeliveryAddressError(
          "Solicitud no encontrada o ya respondida.",
        );
      }
      if (change.order.sellerId !== input.sellerId) {
        throw new DeliveryAddressError(
          "Solo el vendedor puede responder esta solicitud.",
        );
      }

      const blockReason = deliveryAddressChangeBlockedReason({
        orderStatus: change.order.status,
        deliveryAddressFrozenAt: change.order.deliveryAddressFrozenAt,
        shipment: change.order.shipment,
        hasPendingChange: true,
      });
      if (blockReason) {
        throw new DeliveryAddressError(blockReason);
      }

      orderId = change.orderId;
      const now = new Date();
      if (input.decision === "reject") {
        await tx.orderDeliveryAddressChange.update({
          where: { id: change.id },
          data: {
            status: "REJECTED",
            respondedById: input.sellerId,
            respondedAt: now,
          },
        });
        return;
      }

      await tx.order.update({
        where: { id: change.orderId },
        data: {
          deliveryRecipientName: change.newRecipientName,
          deliveryPhone: change.newPhone,
          deliveryCity: change.newCity,
          deliveryDepartment: change.newDepartment,
          deliveryAddressLine: change.newAddressLine,
          deliveryNotes: change.newNotes,
        },
      });
      await tx.orderDeliveryAddressChange.update({
        where: { id: change.id },
        data: {
          status: "ACCEPTED",
          respondedById: input.sellerId,
          respondedAt: now,
        },
      });
    });
    return { ok: true, orderId };
  } catch (error) {
    if (error instanceof DeliveryAddressError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}
