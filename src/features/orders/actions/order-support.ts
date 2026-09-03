"use server";

/**
 * @file order-support.ts
 * @description Server Actions for seller-created order-support cases and conversation replies.
 * @dependencies next/cache, auth session, order-support schemas and service
 */

import { revalidatePath } from "next/cache";

import {
  createOrderSupportCaseSchema,
  replyOrderSupportCaseSchema,
  withdrawOrderSupportCaseSchema,
  type OrderSupportActionState,
} from "@/features/orders/schemas/order-support";
import { fieldErrorsFromZod } from "@/features/orders/schemas/order";
import { getCurrentProfile, getRequestOrigin } from "@/lib/auth/session";
import { safeNotify } from "@/lib/notifications/marketplace";
import { notifyAssignedStaffOrderSupportReply } from "@/lib/notifications/order-support";
import {
  createOrderSupportCase,
  replyToOrderSupportCaseAsSeller,
  withdrawOrderSupportCase,
} from "@/lib/orders/order-support-service";

/**
 * revalidateOrderSupportPaths
 *
 * Refreshes seller order pages and the staff support queue after a case mutation.
 *
 * @param orderId - Optional affected order.
 * @param caseId - Optional affected support case.
 * @calledBy all order-support Server Actions
 */
function revalidateOrderSupportPaths(orderId?: string, caseId?: string) {
  revalidatePath("/ventas");
  revalidatePath("/revision");
  revalidatePath("/revision/soporte-pedidos");
  if (orderId) revalidatePath(`/ventas/${orderId}`);
  if (caseId) revalidatePath(`/revision/soporte-pedidos/${caseId}`);
}

/**
 * createOrderSupportCaseAction
 *
 * Creates an eligible support request for the authenticated order seller.
 *
 * @param _prev - Previous useActionState value.
 * @param formData - orderId, type, and initialReason.
 * @returns Success confirmation or validation/lifecycle error.
 * @calledBy OrderSupportPanel
 */
export async function createOrderSupportCaseAction(
  _prev: OrderSupportActionState,
  formData: FormData,
): Promise<OrderSupportActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const parsed = createOrderSupportCaseSchema.safeParse({
    orderId: formData.get("orderId"),
    type: formData.get("type"),
    initialReason: formData.get("initialReason"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa la solicitud.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await createOrderSupportCase({
    ...parsed.data,
    sellerId: current.profile.id,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateOrderSupportPaths(parsed.data.orderId, result.data.caseId);
  return {
    ok: true,
    caseId: result.data.caseId,
    message:
      "Solicitud enviada. El equipo revisará el pedido y responderá en esta página.",
  };
}

/**
 * replyToOrderSupportCaseAction
 *
 * Adds a seller reply to an active case they own.
 *
 * @param _prev - Previous useActionState value.
 * @param formData - caseId and body.
 * @returns Success confirmation or access/lifecycle error.
 * @calledBy OrderSupportCaseCard
 */
export async function replyToOrderSupportCaseAction(
  _prev: OrderSupportActionState,
  formData: FormData,
): Promise<OrderSupportActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión.", loginRequired: true };
  }

  const parsed = replyOrderSupportCaseSchema.safeParse({
    caseId: formData.get("caseId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa el mensaje.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await replyToOrderSupportCaseAsSeller({
    ...parsed.data,
    sellerId: current.profile.id,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateOrderSupportPaths(result.data.orderId, result.data.caseId);
  if (result.data.assignedStaffId) {
    await safeNotify(
      notifyAssignedStaffOrderSupportReply({
        caseId: result.data.caseId,
        messageId: result.data.messageId,
        staffId: result.data.assignedStaffId,
        orderId: result.data.orderId,
        preview: parsed.data.body,
        siteOrigin: await getRequestOrigin(),
      }),
    );
  }
  return { ok: true, message: "Mensaje enviado." };
}

/**
 * withdrawOrderSupportCaseAction
 *
 * Withdraws an untouched pending case for its authenticated seller.
 *
 * @param _prev - Previous useActionState value.
 * @param formData - caseId.
 * @returns Success confirmation or lifecycle error.
 * @calledBy OrderSupportCaseCard
 */
export async function withdrawOrderSupportCaseAction(
  _prev: OrderSupportActionState,
  formData: FormData,
): Promise<OrderSupportActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión.", loginRequired: true };
  }

  const parsed = withdrawOrderSupportCaseSchema.safeParse({
    caseId: formData.get("caseId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Solicitud inválida." };
  }

  const result = await withdrawOrderSupportCase({
    caseId: parsed.data.caseId,
    sellerId: current.profile.id,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateOrderSupportPaths(undefined, result.data.caseId);
  return { ok: true, message: "Retiraste la solicitud." };
}
