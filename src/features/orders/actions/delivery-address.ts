"use server";

/**
 * @file delivery-address.ts
 * @description Server actions for checkout delivery address and post-payment changes.
 * @dependencies next/cache, delivery-address schemas/service, auth session
 */

import { revalidatePath } from "next/cache";

import {
  fieldErrorsFromZod,
  requestDeliveryAddressChangeSchema,
  respondDeliveryAddressChangeSchema,
  type DeliveryAddressActionState,
} from "@/features/orders/schemas/delivery-address";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  requestDeliveryAddressChange,
  respondDeliveryAddressChange,
} from "@/lib/orders/delivery-address-service";

/**
 * revalidateOrderDeliveryPaths
 *
 * @param orderId - Order whose buyer/seller pages should refresh.
 * @calledBy delivery address actions
 */
function revalidateOrderDeliveryPaths(orderId: string) {
  revalidatePath("/compras");
  revalidatePath("/ventas");
  revalidatePath(`/compras/${orderId}`);
  revalidatePath(`/ventas/${orderId}`);
}

/**
 * requestDeliveryAddressChangeAction
 *
 * Buyer submits a new delivery address for seller approval before handoff.
 *
 * @param _prev - useActionState previous value.
 * @param formData - Order id and address fields.
 * @returns DeliveryAddressActionState.
 * @calledBy OrderDeliveryAddressPanel
 */
export async function requestDeliveryAddressChangeAction(
  _prev: DeliveryAddressActionState,
  formData: FormData,
): Promise<DeliveryAddressActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const parsed = requestDeliveryAddressChangeSchema.safeParse({
    orderId: formData.get("orderId"),
    recipientName: formData.get("recipientName"),
    phone: formData.get("phone"),
    department: formData.get("department"),
    cityOption: formData.get("cityOption"),
    cityDetail: formData.get("cityDetail"),
    addressLine: formData.get("addressLine"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa la dirección propuesta.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await requestDeliveryAddressChange({
    orderId: parsed.data.orderId,
    buyerId: current.profile.id,
    address: parsed.data,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidateOrderDeliveryPaths(parsed.data.orderId);
  return {
    ok: true,
    message: "Solicitud enviada. El vendedor debe aceptarla en la plataforma.",
  };
}

/**
 * respondDeliveryAddressChangeAction
 *
 * Seller accepts or rejects a pending delivery address change.
 *
 * @param _prev - useActionState previous value.
 * @param formData - changeId and decision.
 * @returns DeliveryAddressActionState.
 * @calledBy OrderDeliveryAddressPanel
 */
export async function respondDeliveryAddressChangeAction(
  _prev: DeliveryAddressActionState,
  formData: FormData,
): Promise<DeliveryAddressActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const parsed = respondDeliveryAddressChangeSchema.safeParse({
    changeId: formData.get("changeId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Solicitud inválida." };
  }

  const result = await respondDeliveryAddressChange({
    changeId: parsed.data.changeId,
    sellerId: current.profile.id,
    decision: parsed.data.decision,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidateOrderDeliveryPaths(result.orderId);
  return {
    ok: true,
    message:
      parsed.data.decision === "accept"
        ? "Dirección actualizada."
        : "Solicitud rechazada.",
  };
}
