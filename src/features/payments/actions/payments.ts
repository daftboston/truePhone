"use server";

/**
 * @file payments.ts
 * @description Server actions to start checkout and confirm mock payments.
 * @dependencies next/cache, next/navigation, payment schemas, @/lib/payments
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  confirmMockPaymentSchema,
  fieldErrorsFromZod,
  startCheckoutSchema,
  type PaymentActionState,
} from "@/features/payments/schemas/payment";
import { getCurrentProfile, getRequestOrigin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { confirmMockPayment, startCheckoutForOrder } from "@/lib/payments";
import { isMockPaymentsEnabled } from "@/lib/payments/resolve-provider";

/**
 * revalidatePaymentPaths
 *
 * Refreshes buyer/seller order lists and payment review after payment changes.
 *
 * @param orderId - Order whose detail pages should revalidate.
 * @calledBy startCheckoutAction, confirmMockPaymentAction
 */
function revalidatePaymentPaths(orderId: string) {
  revalidatePath("/compras");
  revalidatePath("/ventas");
  revalidatePath(`/compras/${orderId}`);
  revalidatePath(`/ventas/${orderId}`);
  revalidatePath("/revision/pagos");
}

/**
 * startCheckoutAction
 *
 * Starts provider checkout for the authenticated buyer and redirects to checkout URL.
 *
 * @param orderId - Order to pay.
 * @returns PaymentActionState on auth/validation/provider errors; redirects on success.
 * @calledBy PayOrderButton
 */
export async function startCheckoutAction(
  orderId: string,
): Promise<PaymentActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión para pagar.",
      loginRequired: true,
    };
  }

  const parsed = startCheckoutSchema.safeParse({ orderId });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Pedido inválido.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await startCheckoutForOrder({
    orderId: parsed.data.orderId,
    buyerId: current.profile.id,
    buyerEmail: current.user.email,
    siteOrigin: await getRequestOrigin(),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePaymentPaths(parsed.data.orderId);
  redirect(result.checkoutUrl);
}

/**
 * confirmMockPaymentAction
 *
 * Approves a MOCK payment for the owning buyer when mock mode is enabled.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - reference field.
 * @returns PaymentActionState on errors; redirects to compra detail on success.
 * @calledBy MockCheckoutConfirm
 */
export async function confirmMockPaymentAction(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  if (!isMockPaymentsEnabled()) {
    return { ok: false, error: "El modo mock no está activo." };
  }

  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const parsed = confirmMockPaymentSchema.safeParse({
    reference: formData.get("reference"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Referencia inválida.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const row = await prisma.payment.findFirst({
    where: { reference: parsed.data.reference, provider: "MOCK" },
    select: { buyerId: true, orderId: true, status: true },
  });
  if (!row) {
    return { ok: false, error: "Pago mock no encontrado." };
  }
  if (row.buyerId !== current.profile.id) {
    return { ok: false, error: "No tienes acceso a este pago." };
  }

  const payment = await confirmMockPayment({
    reference: parsed.data.reference,
  });
  if (!payment.ok) {
    return { ok: false, error: payment.error };
  }

  revalidatePaymentPaths(payment.orderId);
  redirect(`/compras/${payment.orderId}?pago=ok`);
}
