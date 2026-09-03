"use server";

/**
 * @file orders.ts
 * @description Server actions for orders (orders.ts).
 * @dependencies next/cache, next/navigation, @/features/orders/schemas/order, @/lib/auth/session, @/lib/orders
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  cancelOrderSchema,
  createOrderSchema,
  fieldErrorsFromZod,
  type OrderActionState,
} from "@/features/orders/schemas/order";
import { getCurrentProfile, getRequestOrigin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  cancelOrder,
  chooseRefundAfterSellerAbandon,
  createOrderAndReserveListing,
} from "@/lib/orders";
import { safeNotify } from "@/lib/notifications/marketplace";
import { notifyBuyerRefundCompleted } from "@/lib/notifications/order-support";

/**
 * revalidateOrderPaths
 *
 * Revalidates Next.js paths after orders mutations.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy orders UI and related modules
 */
function revalidateOrderPaths(input: {
  orderId?: string;
  listingId?: string;
  listingSlug?: string | null;
}) {
  revalidatePath("/compras");
  revalidatePath("/ventas");
  revalidatePath("/vender");
  revalidatePath("/revision/soporte-pedidos");
  revalidatePath("/revision/anuncios");
  revalidatePath("/revision");
  if (input.orderId) {
    revalidatePath(`/compras/${input.orderId}`);
    revalidatePath(`/ventas/${input.orderId}`);
  }
  if (input.listingId) {
    revalidatePath(`/vender/${input.listingId}`);
  }
  if (input.listingSlug) {
    revalidatePath(`/anuncios/${input.listingSlug}`);
  }
  revalidatePath("/", "layout");
}

/**
 * revalidateForOrderId
 *
 * Revalidates order hubs and the public listing page for an order.
 *
 * @param orderId - Order UUID.
 * @param listingId - Optional listing id when already known.
 * @param listingSlug - Optional public slug when already known.
 */
async function revalidateForOrderId(
  orderId: string,
  listingId?: string,
  listingSlug?: string | null,
) {
  if (listingId !== undefined || listingSlug !== undefined) {
    revalidateOrderPaths({ orderId, listingId, listingSlug });
    return;
  }
  const row = await prisma.order.findFirst({
    where: { id: orderId },
    select: { listingId: true, listing: { select: { slug: true } } },
  });
  revalidateOrderPaths({
    orderId,
    listingId: row?.listingId,
    listingSlug: row?.listing.slug ?? null,
  });
}

/**
 * createOrderAction
 *
 * Server action: create order for authenticated orders flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy orders components
 */
export async function createOrderAction(
  listingId: string,
): Promise<OrderActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión para comprar.",
      loginRequired: true,
    };
  }

  const parsed = createOrderSchema.safeParse({ listingId });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Anuncio inválido.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await createOrderAndReserveListing({
    listingId: parsed.data.listingId,
    buyerId: current.profile.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidateOrderPaths({
    orderId: result.orderId,
    listingId: parsed.data.listingId,
    listingSlug: result.listingSlug,
  });
  redirect(`/compras/${result.orderId}`);
}

/**
 * cancelOrderAction
 *
 * Server action: cancel order for authenticated orders flows.
 *
 * @param _prev - Previous form state from useActionState when applicable.
 * @param formDataOrArgs - FormData or typed action arguments.
 * @returns Action state on errors; may redirect on success.
 * @calledBy orders components
 */
export async function cancelOrderAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const parsed = cancelOrderSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason") || null,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa el formulario.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await cancelOrder({
    orderId: parsed.data.orderId,
    actorId: current.profile.id,
    reason: parsed.data.reason,
    siteOrigin: await getRequestOrigin(),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  await revalidateForOrderId(
    parsed.data.orderId,
    result.listingId,
    result.listingSlug,
  );
  return {
    ok: true,
    message:
      result.message ?? "Pedido cancelado. El anuncio volvió a publicarse.",
  };
}

/**
 * chooseRefundAfterSellerAbandonAction
 *
 * Server action: buyer chooses full refund after seller cancel / no-ship.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - Form with orderId.
 * @returns Action state; revalidates order paths on success.
 * @calledBy BuyerAbandonChoice
 */
export async function chooseRefundAfterSellerAbandonAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const parsed = cancelOrderSchema.pick({ orderId: true }).safeParse({
    orderId: formData.get("orderId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Pedido inválido." };
  }

  const siteOrigin = await getRequestOrigin();
  const result = await chooseRefundAfterSellerAbandon({
    orderId: parsed.data.orderId,
    buyerId: current.profile.id,
    siteOrigin,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  await revalidateForOrderId(parsed.data.orderId);
  await safeNotify(
    notifyBuyerRefundCompleted({
      orderId: parsed.data.orderId,
      siteOrigin,
    }),
  );
  return {
    ok: true,
    message:
      "Reembolso autorizado. El dinero vuelve por el mismo medio de pago.",
  };
}
