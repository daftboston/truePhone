"use server";

/**
 * @file shipping.ts
 * @description Server actions for shipping method, tracking, inspection, confirm, and dispute freeze.
 * @dependencies next/cache, shipping schemas, @/lib/shipping, financial-core settlement
 */

import { revalidatePath } from "next/cache";

import {
  confirmReceivedSchema,
  fieldErrorsFromZod,
  markReceivedSchema,
  premiumInspectionSchema,
  reportProblemSchema,
  resolveCarrierNameFromForm,
  selectShippingMethodSchema,
  switchShippingMethodSchema,
  uploadCarrierTrackingSchema,
  type ShippingActionState,
} from "@/features/shipping/schemas/shipping";
import { getCurrentProfile, getRequestOrigin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  confirmOrderByBuyer,
  freezePayout,
} from "@/lib/financial-core/settlement";
import {
  markOrderReceivedByBuyer,
  recordPremiumInspection,
  selectShippingMethod,
  switchCarrierToPremium,
  switchPremiumToCarrier,
  uploadCarrierTracking,
} from "@/lib/shipping";

/**
 * revalidateShippingPaths
 *
 * Refreshes buyer/seller order views and ops review after shipping changes.
 *
 * @param orderId - Order whose detail pages should revalidate.
 * @calledBy all shipping actions in this file
 */
function revalidateShippingPaths(orderId: string) {
  revalidatePath("/compras");
  revalidatePath("/ventas");
  revalidatePath(`/compras/${orderId}`);
  revalidatePath(`/ventas/${orderId}`);
  revalidatePath("/revision");
}

/**
 * revalidateAfterBuyerReceived
 *
 * Same as shipping path revalidation plus activity center (Phase 12 notification).
 *
 * @param orderId - Order that started the confirm window.
 * @calledBy markOrderReceivedByBuyerAction
 */
function revalidateAfterBuyerReceived(orderId: string) {
  revalidateShippingPaths(orderId);
  revalidatePath("/notificaciones");
  revalidatePath("/", "layout");
}

/**
 * selectShippingMethodAction
 *
 * Lets the seller choose Premium Bogotá or carrier shipping for a paid order.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - orderId, method.
 * @returns ShippingActionState with message or error.
 * @calledBy OrderShippingPanel
 */
export async function selectShippingMethodAction(
  _prev: ShippingActionState,
  formData: FormData,
): Promise<ShippingActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const parsed = selectShippingMethodSchema.safeParse({
    orderId: formData.get("orderId"),
    method: formData.get("method"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa el método de envío.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await selectShippingMethod({
    orderId: parsed.data.orderId,
    sellerId: current.profile.id,
    method: parsed.data.method,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateShippingPaths(parsed.data.orderId);
  return { ok: true, message: result.message };
}

/**
 * switchCarrierToPremiumAction
 *
 * Switches an eligible carrier shipment to Premium before tracking is locked.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - orderId.
 * @returns ShippingActionState with message or error.
 * @calledBy OrderShippingPanel
 */
export async function switchCarrierToPremiumAction(
  _prev: ShippingActionState,
  formData: FormData,
): Promise<ShippingActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const parsed = switchShippingMethodSchema.safeParse({
    orderId: formData.get("orderId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Pedido inválido." };
  }

  const result = await switchCarrierToPremium({
    orderId: parsed.data.orderId,
    sellerId: current.profile.id,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateShippingPaths(parsed.data.orderId);
  return { ok: true, message: result.message };
}

/**
 * switchPremiumToCarrierAction
 *
 * Switches an eligible Premium shipment back to carrier before inspection locks it.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - orderId.
 * @returns ShippingActionState with message or error.
 * @calledBy OrderShippingPanel
 */
export async function switchPremiumToCarrierAction(
  _prev: ShippingActionState,
  formData: FormData,
): Promise<ShippingActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const parsed = switchShippingMethodSchema.safeParse({
    orderId: formData.get("orderId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Pedido inválido." };
  }

  const result = await switchPremiumToCarrier({
    orderId: parsed.data.orderId,
    sellerId: current.profile.id,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateShippingPaths(parsed.data.orderId);
  return { ok: true, message: result.message };
}

/**
 * uploadCarrierTrackingAction
 *
 * Saves carrier tracking details for a seller-owned shipment.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - orderId, carrierName, trackingCode, optional evidenceUrl.
 * @returns ShippingActionState with message or field errors.
 * @calledBy OrderShippingPanel
 */
export async function uploadCarrierTrackingAction(
  _prev: ShippingActionState,
  formData: FormData,
): Promise<ShippingActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const evidenceRaw = formData.get("evidenceUrl");
  const carrierName = resolveCarrierNameFromForm(
    formData.get("carrierName"),
    formData.get("carrierNameOther"),
  );
  const parsed = uploadCarrierTrackingSchema.safeParse({
    orderId: formData.get("orderId"),
    carrierName,
    trackingCode: formData.get("trackingCode"),
    evidenceUrl:
      typeof evidenceRaw === "string" && evidenceRaw.trim()
        ? evidenceRaw.trim()
        : null,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los datos de seguimiento.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await uploadCarrierTracking({
    orderId: parsed.data.orderId,
    sellerId: current.profile.id,
    carrierName: parsed.data.carrierName,
    trackingCode: parsed.data.trackingCode,
    evidenceUrl: parsed.data.evidenceUrl || null,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateShippingPaths(parsed.data.orderId);
  return { ok: true, message: result.message };
}

/**
 * markOrderReceivedByBuyerAction
 *
 * Records buyer physical receipt and starts the 24h confirm window.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - orderId.
 * @returns ShippingActionState with message or error.
 * @calledBy OrderShippingPanel
 */
export async function markOrderReceivedByBuyerAction(
  _prev: ShippingActionState,
  formData: FormData,
): Promise<ShippingActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const parsed = markReceivedSchema.safeParse({
    orderId: formData.get("orderId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Pedido inválido." };
  }

  const result = await markOrderReceivedByBuyer({
    orderId: parsed.data.orderId,
    buyerId: current.profile.id,
    siteOrigin: await getRequestOrigin(),
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateAfterBuyerReceived(parsed.data.orderId);
  return { ok: true, message: result.message };
}

/**
 * recordPremiumInspectionAction
 *
 * Records ops Premium inspection checklist and pass/fail result.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - orderId, result, checklist fields, optional notes.
 * @returns ShippingActionState with message or field errors.
 * @calledBy OrderShippingPanel
 */
export async function recordPremiumInspectionAction(
  _prev: ShippingActionState,
  formData: FormData,
): Promise<ShippingActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const parsed = premiumInspectionSchema.safeParse({
    orderId: formData.get("orderId"),
    result: formData.get("result"),
    imeiMatch:
      formData.get("imeiMatch") === "on" ||
      formData.get("imeiMatch") === "true",
    serialMatch:
      formData.get("serialMatch") === "on" ||
      formData.get("serialMatch") === "true",
    storageMatch:
      formData.get("storageMatch") === "on" ||
      formData.get("storageMatch") === "true",
    colorMatch:
      formData.get("colorMatch") === "on" ||
      formData.get("colorMatch") === "true",
    accessoriesOk:
      formData.get("accessoriesOk") === "on" ||
      formData.get("accessoriesOk") === "true",
    batteryHealthPct: formData.get("batteryHealthPct") || null,
    cosmeticNotes: formData.get("cosmeticNotes") || null,
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa la inspección.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await recordPremiumInspection({
    orderId: parsed.data.orderId,
    actorId: current.profile.id,
    actorRole: current.profile.role,
    result: parsed.data.result,
    imeiMatch: parsed.data.imeiMatch,
    serialMatch: parsed.data.serialMatch,
    storageMatch: parsed.data.storageMatch,
    colorMatch: parsed.data.colorMatch,
    accessoriesOk: parsed.data.accessoriesOk,
    batteryHealthPct: parsed.data.batteryHealthPct,
    cosmeticNotes: parsed.data.cosmeticNotes,
    notes: parsed.data.notes,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateShippingPaths(parsed.data.orderId);
  return { ok: true, message: result.message };
}

/**
 * confirmOrderReceivedAction
 *
 * Buyer confirms the device is correct so settlement can proceed.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - orderId.
 * @returns ShippingActionState with success message or error.
 * @calledBy OrderShippingPanel
 */
export async function confirmOrderReceivedAction(
  _prev: ShippingActionState,
  formData: FormData,
): Promise<ShippingActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const parsed = confirmReceivedSchema.safeParse({
    orderId: formData.get("orderId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Pedido inválido." };
  }

  const result = await confirmOrderByBuyer({
    orderId: parsed.data.orderId,
    buyerId: current.profile.id,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateShippingPaths(parsed.data.orderId);
  return {
    ok: true,
    message:
      "Confirmaste el dispositivo. TruePhone procesará el pago al vendedor.",
  };
}

/**
 * reportOrderProblemAction
 *
 * Freezes seller payout after the buyer reports a post-receipt problem.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - orderId, reason.
 * @returns ShippingActionState with success message or error.
 * @calledBy OrderShippingPanel
 */
export async function reportOrderProblemAction(
  _prev: ShippingActionState,
  formData: FormData,
): Promise<ShippingActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const parsed = reportProblemSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Describe el problema.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const order = await prisma.order.findFirst({
    where: { id: parsed.data.orderId },
    select: { buyerId: true, buyerConfirmDeadlineAt: true, status: true },
  });
  if (!order || order.buyerId !== current.profile.id) {
    return {
      ok: false,
      error: "Solo el comprador puede reportar un problema.",
    };
  }
  if (order.status !== "PAID" || !order.buyerConfirmDeadlineAt) {
    return {
      ok: false,
      error:
        "Solo puedes reportar después de confirmar que recibiste el iPhone.",
    };
  }

  const result = await freezePayout({
    orderId: parsed.data.orderId,
    reason: parsed.data.reason,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateShippingPaths(parsed.data.orderId);
  return {
    ok: true,
    message:
      "Problema reportado. Congelamos el pago al vendedor mientras TruePhone revisa el caso.",
  };
}
