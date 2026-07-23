"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  cancelOrderSchema,
  completeOrderSchema,
  createOrderSchema,
  fieldErrorsFromZod,
  type OrderActionState,
} from "@/features/orders/schemas/order";
import { getCurrentProfile, getRequestOrigin } from "@/lib/auth/session";
import {
  cancelOrder,
  completeOrder,
  createOrderAndReserveListing,
} from "@/lib/orders";

function revalidateOrderPaths(input: {
  orderId?: string;
  listingId?: string;
  listingSlug?: string | null;
}) {
  revalidatePath("/compras");
  revalidatePath("/ventas");
  revalidatePath("/vender");
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
  });
  redirect(`/compras/${result.orderId}`);
}

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

  revalidateOrderPaths({ orderId: parsed.data.orderId });
  return {
    ok: true,
    message: "Pedido cancelado. El anuncio volvió a publicarse.",
  };
}

export async function completeOrderAction(
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

  const parsed = completeOrderSchema.safeParse({
    orderId: formData.get("orderId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Pedido inválido." };
  }

  const result = await completeOrder({
    orderId: parsed.data.orderId,
    sellerId: current.profile.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidateOrderPaths({ orderId: parsed.data.orderId });
  return {
    ok: true,
    message: "Venta marcada como completada. Ambos pueden dejar una reseña.",
  };
}
