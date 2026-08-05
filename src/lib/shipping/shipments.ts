/**
 * @file shipments.ts
 * @description Shipment lifecycle mutations: method select, switches, tracking, inspection, receipt.
 * @dependencies financial-core, settlement, eligibility, labels, @/lib/db
 */

import type { Prisma, ShippingMethod } from "@prisma/client";

import {
  appendLedgerEntry,
  computeOrderFees,
  PREMIUM_SHIPPING_FEE_PESOS,
} from "@/lib/financial-core";
import { onBuyerMarkedReceived } from "@/lib/financial-core/settlement";
import { prisma } from "@/lib/db";
import {
  canSelectShippingMethod,
  canSwitchCarrierToPremium,
  canSwitchPremiumToCarrier,
  type ShippingMethodOption,
} from "@/lib/shipping/eligibility";
import { CARRIER_OPTIONS } from "@/lib/shipping/labels";

class ShippingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShippingError";
  }
}

export type ShippingResult =
  { ok: true; message?: string } | { ok: false; error: string };

type Tx = Prisma.TransactionClient;

/**
 * isOpsRole
 *
 * @param role - Profile role string.
 * @returns True for REVIEWER or ADMIN.
 */
function isOpsRole(role: string) {
  return role === "REVIEWER" || role === "ADMIN";
}

/**
 * loadPaidOrder
 *
 * Loads a PAID order with seller city and shipment for shipping mutations.
 *
 * @param tx - Prisma transaction client.
 * @param orderId - Order UUID.
 * @returns Order with shipment include.
 * @throws ShippingError when missing or not PAID.
 */
async function loadPaidOrder(tx: Tx, orderId: string) {
  const order = await tx.order.findFirst({
    where: { id: orderId },
    include: {
      seller: { select: { id: true, city: true } },
      shipment: { include: { inspection: true } },
    },
  });
  if (!order) throw new ShippingError("Pedido no encontrado.");
  if (order.status !== "PAID") {
    throw new ShippingError(
      "El envío solo aplica cuando el pago está en custodia.",
    );
  }
  return order;
}

/**
 * selectShippingMethod
 *
 * Seller chooses Premium (Bogotá) or Carrier after payment.
 *
 * @param input.orderId - Paid order UUID.
 * @param input.sellerId - Must be the order seller.
 * @param input.method - PREMIUM_BOGOTA or CARRIER.
 * @returns ShippingResult.
 * @calledBy Shipping select actions
 */
export async function selectShippingMethod(input: {
  orderId: string;
  sellerId: string;
  method: ShippingMethodOption;
}): Promise<ShippingResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await loadPaidOrder(tx, input.orderId);
      if (order.sellerId !== input.sellerId) {
        throw new ShippingError("Solo el vendedor puede elegir el envío.");
      }
      if (order.shipment) {
        throw new ShippingError("Ya elegiste un método de envío.");
      }
      if (!canSelectShippingMethod(order.seller.city, input.method)) {
        throw new ShippingError(
          input.method === "PREMIUM_BOGOTA"
            ? "TruePhone Premium solo está disponible si tu ciudad de perfil es Bogotá."
            : "Método de envío no disponible.",
        );
      }

      const now = new Date();
      const isPremium = input.method === "PREMIUM_BOGOTA";
      const premiumFee = isPremium ? PREMIUM_SHIPPING_FEE_PESOS : 0;

      await tx.shipment.create({
        data: {
          orderId: order.id,
          method: input.method,
          status: isPremium ? "AWAITING_PICKUP" : "METHOD_SELECTED",
          premiumFeeCop: premiumFee,
          methodSelectedAt: now,
          pickupScheduledAt: isPremium ? now : null,
          inspection: isPremium ? { create: { result: "PENDING" } } : undefined,
        },
      });

      if (isPremium) {
        const fees = computeOrderFees({
          salePrice: order.equipmentPrice,
          feeRateBps: order.feeRateBps,
          premiumShippingFeePesos: premiumFee,
          sellerFeePesos: order.sellerFeePesos,
        });
        await tx.order.update({
          where: { id: order.id },
          data: {
            premiumShippingFeePesos: fees.premiumShippingFeePesos,
            sellerAmountPesos: fees.sellerAmountPesos,
            wompiPayoutPesos: fees.wompiPayoutPesos,
            truephoneRevenuePesos: fees.truephoneRevenuePesos,
          },
        });
        await appendLedgerEntry(tx, {
          orderId: order.id,
          type: "PREMIUM_SHIPPING_FEE",
          amountPesos: premiumFee,
          currency: order.currency,
          memo: "Premium Bogotá logistics fee · deducted from seller payout",
        });
      }
    });

    return {
      ok: true,
      message:
        input.method === "PREMIUM_BOGOTA"
          ? "Elegiste TruePhone Premium. Coordinaremos la recogida en Bogotá ($20.000 se descontarán de tu pago)."
          : "Elegiste transportadora. Sube el nombre y el código de seguimiento.",
    };
  } catch (error) {
    if (error instanceof ShippingError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * switchCarrierToPremium
 *
 * Bogotá sellers who picked Carrier may switch to Premium until tracking is saved.
 *
 * @param input.orderId - Paid order id
 * @param input.sellerId - Must be the order seller
 * @returns ShippingResult with Spanish UX message
 * @calledBy switchCarrierToPremiumAction
 */
export async function switchCarrierToPremium(input: {
  orderId: string;
  sellerId: string;
}): Promise<ShippingResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await loadPaidOrder(tx, input.orderId);
      if (order.sellerId !== input.sellerId) {
        throw new ShippingError("Solo el vendedor puede cambiar el envío.");
      }
      if (
        !canSwitchCarrierToPremium({
          sellerCity: order.seller.city,
          shipment: order.shipment,
        })
      ) {
        throw new ShippingError(
          order.shipment?.trackingCode
            ? "Ya guardaste el seguimiento por transportadora; no puedes cambiar a Premium."
            : "TruePhone Premium no está disponible para este pedido.",
        );
      }

      const shipment = order.shipment!;
      const now = new Date();
      const premiumFee = PREMIUM_SHIPPING_FEE_PESOS;

      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          method: "PREMIUM_BOGOTA",
          status: "AWAITING_PICKUP",
          premiumFeeCop: premiumFee,
          methodSelectedAt: now,
          pickupScheduledAt: now,
          carrierName: null,
          trackingCode: null,
          evidenceUrl: null,
          trackingUploadedAt: null,
          inTransitAt: null,
        },
      });

      if (!shipment.inspection) {
        await tx.shipmentInspection.create({
          data: { shipmentId: shipment.id, result: "PENDING" },
        });
      }

      const fees = computeOrderFees({
        salePrice: order.equipmentPrice,
        feeRateBps: order.feeRateBps,
        premiumShippingFeePesos: premiumFee,
        sellerFeePesos: order.sellerFeePesos,
      });
      await tx.order.update({
        where: { id: order.id },
        data: {
          premiumShippingFeePesos: fees.premiumShippingFeePesos,
          sellerAmountPesos: fees.sellerAmountPesos,
          wompiPayoutPesos: fees.wompiPayoutPesos,
          truephoneRevenuePesos: fees.truephoneRevenuePesos,
        },
      });
      await appendLedgerEntry(tx, {
        orderId: order.id,
        type: "PREMIUM_SHIPPING_FEE",
        amountPesos: premiumFee,
        currency: order.currency,
        memo: "Switched Carrier → Premium Bogotá · fee deducted from seller payout",
      });
    });

    return {
      ok: true,
      message:
        "Cambiaste a TruePhone Premium. Coordinaremos la recogida en Bogotá ($20.000 se descontarán de tu pago).",
    };
  } catch (error) {
    if (error instanceof ShippingError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * switchPremiumToCarrier
 *
 * Bogotá sellers who picked Premium may switch to Carrier until inspection passes
 * or logistics leave awaiting-pickup / method-selected.
 * Clears the $20,000 premium fee snapshot and appends a reversing ledger note.
 *
 * @param input.orderId - Paid order id
 * @param input.sellerId - Must be the order seller
 * @returns ShippingResult with Spanish UX message
 * @calledBy switchPremiumToCarrierAction
 */
export async function switchPremiumToCarrier(input: {
  orderId: string;
  sellerId: string;
}): Promise<ShippingResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await loadPaidOrder(tx, input.orderId);
      if (order.sellerId !== input.sellerId) {
        throw new ShippingError("Solo el vendedor puede cambiar el envío.");
      }
      if (
        !canSwitchPremiumToCarrier({
          sellerCity: order.seller.city,
          shipment: order.shipment,
        })
      ) {
        throw new ShippingError(
          order.shipment?.inspection?.result === "PASSED"
            ? "La inspección Premium ya fue aprobada; no puedes cambiar a transportadora."
            : "Ya no puedes cambiar de TruePhone Premium a transportadora en este pedido.",
        );
      }

      const shipment = order.shipment!;
      const now = new Date();
      const priorPremiumFee =
        order.premiumShippingFeePesos ||
        shipment.premiumFeeCop ||
        PREMIUM_SHIPPING_FEE_PESOS;

      if (shipment.inspection) {
        await tx.shipmentInspection.delete({
          where: { id: shipment.inspection.id },
        });
      }

      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          method: "CARRIER",
          status: "METHOD_SELECTED",
          premiumFeeCop: 0,
          methodSelectedAt: now,
          pickupScheduledAt: null,
          inspectionAt: null,
          inTransitAt: null,
          carrierName: null,
          trackingCode: null,
          evidenceUrl: null,
          trackingUploadedAt: null,
        },
      });

      const fees = computeOrderFees({
        salePrice: order.equipmentPrice,
        feeRateBps: order.feeRateBps,
        premiumShippingFeePesos: 0,
        sellerFeePesos: order.sellerFeePesos,
      });
      await tx.order.update({
        where: { id: order.id },
        data: {
          premiumShippingFeePesos: fees.premiumShippingFeePesos,
          sellerAmountPesos: fees.sellerAmountPesos,
          wompiPayoutPesos: fees.wompiPayoutPesos,
          truephoneRevenuePesos: fees.truephoneRevenuePesos,
        },
      });
      await appendLedgerEntry(tx, {
        orderId: order.id,
        type: "PREMIUM_SHIPPING_FEE",
        amountPesos: -priorPremiumFee,
        currency: order.currency,
        memo: "Switched Premium → Carrier · premium fee reversed / cancelled",
        metadata: {
          priorPremiumFeePesos: priorPremiumFee,
          fromMethod: "PREMIUM_BOGOTA",
          toMethod: "CARRIER",
        },
      });
    });

    return {
      ok: true,
      message:
        "Cambiaste a transportadora. Ya no se descontarán $20.000 de Premium; sube el código de seguimiento cuando envíes.",
    };
  } catch (error) {
    if (error instanceof ShippingError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * uploadCarrierTracking
 *
 * Seller uploads carrier name and tracking code; moves shipment toward in-transit.
 *
 * @param input - orderId, sellerId, carrier, trackingCode.
 * @returns ShippingResult.
 * @calledBy Carrier tracking form actions
 */
export async function uploadCarrierTracking(input: {
  orderId: string;
  sellerId: string;
  carrierName: string;
  trackingCode: string;
  evidenceUrl?: string | null;
}): Promise<ShippingResult> {
  const carrierName = input.carrierName.trim();
  const trackingCode = input.trackingCode.trim();
  if (!carrierName) {
    return { ok: false, error: "Indica la transportadora." };
  }
  if (!trackingCode || trackingCode.length < 4) {
    return { ok: false, error: "El código de seguimiento es obligatorio." };
  }
  if (
    !(CARRIER_OPTIONS as readonly string[]).includes(carrierName) &&
    carrierName.length < 2
  ) {
    return { ok: false, error: "Transportadora inválida." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await loadPaidOrder(tx, input.orderId);
      if (order.sellerId !== input.sellerId) {
        throw new ShippingError("Solo el vendedor puede subir el seguimiento.");
      }
      const shipment = order.shipment;
      if (!shipment || shipment.method !== "CARRIER") {
        throw new ShippingError("Este pedido no usa envío por transportadora.");
      }
      if (shipment.deliveredAt) {
        throw new ShippingError("El pedido ya fue marcado como entregado.");
      }
      if (shipment.status === "FAILED" || shipment.status === "RETURNED") {
        throw new ShippingError("Este envío ya no acepta seguimiento.");
      }

      const now = new Date();
      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          carrierName,
          trackingCode,
          evidenceUrl: input.evidenceUrl?.trim() || null,
          status: "IN_TRANSIT",
          trackingUploadedAt: shipment.trackingUploadedAt ?? now,
          inTransitAt: shipment.inTransitAt ?? now,
        },
      });
    });

    return {
      ok: true,
      message: "Código de seguimiento guardado. El comprador ya puede verlo.",
    };
  } catch (error) {
    if (error instanceof ShippingError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * recordPremiumInspection
 *
 * Ops records Premium inspection pass/fail and advances shipment status.
 *
 * @param input - orderId, actorId, result, notes.
 * @returns ShippingResult.
 * @calledBy Reviewer premium inspection actions
 */
export async function recordPremiumInspection(input: {
  orderId: string;
  actorId: string;
  actorRole: string;
  result: "PASSED" | "FAILED";
  imeiMatch?: boolean;
  serialMatch?: boolean;
  storageMatch?: boolean;
  colorMatch?: boolean;
  accessoriesOk?: boolean;
  batteryHealthPct?: number | null;
  cosmeticNotes?: string | null;
  notes?: string | null;
}): Promise<ShippingResult> {
  if (!isOpsRole(input.actorRole)) {
    return {
      ok: false,
      error: "Solo operaciones TruePhone puede registrar la inspección.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await loadPaidOrder(tx, input.orderId);
      const shipment = order.shipment;
      if (!shipment || shipment.method !== "PREMIUM_BOGOTA") {
        throw new ShippingError("Este pedido no es TruePhone Premium.");
      }
      if (shipment.deliveredAt) {
        throw new ShippingError(
          "Ya fue entregado; no se puede reinspeccionar.",
        );
      }

      const now = new Date();
      const inspectionData = {
        result: input.result,
        imeiMatch: input.imeiMatch ?? null,
        serialMatch: input.serialMatch ?? null,
        storageMatch: input.storageMatch ?? null,
        colorMatch: input.colorMatch ?? null,
        accessoriesOk: input.accessoriesOk ?? null,
        batteryHealthPct: input.batteryHealthPct ?? null,
        cosmeticNotes: input.cosmeticNotes?.trim() || null,
        notes: input.notes?.trim() || null,
        inspectedById: input.actorId,
      };

      if (shipment.inspection) {
        await tx.shipmentInspection.update({
          where: { id: shipment.inspection.id },
          data: inspectionData,
        });
      } else {
        await tx.shipmentInspection.create({
          data: { shipmentId: shipment.id, ...inspectionData },
        });
      }

      if (input.result === "FAILED") {
        await tx.shipment.update({
          where: { id: shipment.id },
          data: {
            status: "FAILED",
            inspectionAt: now,
            failedAt: now,
          },
        });
        await tx.order.update({
          where: { id: order.id },
          data: { payoutFrozen: true },
        });
        await appendLedgerEntry(tx, {
          orderId: order.id,
          type: "DISPUTE_OPENED",
          amountPesos: 0,
          currency: order.currency,
          memo: "Premium inspection failed · device not accepted · payout frozen",
        });
      } else {
        await tx.shipment.update({
          where: { id: shipment.id },
          data: {
            status: "IN_TRANSIT",
            inspectionAt: now,
            inTransitAt: shipment.inTransitAt ?? now,
          },
        });
      }
    });

    return {
      ok: true,
      message:
        input.result === "PASSED"
          ? "Inspección aprobada. El equipo queda en tránsito hacia el comprador."
          : "Inspección rechazada. No se aceptó el equipo; el pago queda congelado para reembolso.",
    };
  } catch (error) {
    if (error instanceof ShippingError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * markOrderReceivedByBuyer
 *
 * Buyer ack of physical receipt; delegates to Financial Core onBuyerMarkedReceived.
 *
 * @param input.orderId - Order UUID.
 * @param input.buyerId - Must be the order buyer.
 * @returns ShippingResult.
 * @calledBy Buyer receipt actions
 */
export async function markOrderReceivedByBuyer(input: {
  orderId: string;
  buyerId: string;
}): Promise<ShippingResult> {
  const core = await onBuyerMarkedReceived({
    orderId: input.orderId,
    buyerId: input.buyerId,
  });
  if (!core.ok) {
    return { ok: false, error: core.error };
  }
  return {
    ok: true,
    message:
      "Registramos que recibiste el iPhone. Tienes 24 horas para confirmar que está correcto o reportar un problema.",
  };
}

/**
 * shipmentMethodSelected
 *
 * Type predicate / helper: whether an order already has a selected shipment method.
 *
 * @param order - Order with optional shipment.
 * @returns True when shipment exists.
 * @calledBy Shipping UI conditionals
 */
export function shipmentMethodSelected(
  method: ShippingMethod | null | undefined,
): method is ShippingMethod {
  return method === "PREMIUM_BOGOTA" || method === "CARRIER";
}
