"use server";

/**
 * @file availability-hold.ts
 * @description Server actions for multi-platform availability holds (F3).
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  confirmAvailabilityHold,
  denyAvailabilityHold,
  linkHoldToOrder,
  requestAvailabilityHold,
} from "@/lib/availability-hold/service";
import { getRequestOrigin, getCurrentProfile } from "@/lib/auth/session";
import {
  notifyBuyerAvailabilityHoldConfirmed,
  notifyBuyerAvailabilityHoldDenied,
  notifySellerAvailabilityHoldRequest,
} from "@/lib/notifications/availability-hold";
import { safeNotify } from "@/lib/notifications/marketplace";
import { createOrderAndReserveListing } from "@/lib/orders";
import { publicListingPath } from "@/lib/listings-marketplace";
import { prisma } from "@/lib/db";

export type AvailabilityHoldActionState = {
  ok: boolean;
  error?: string;
  loginRequired?: boolean;
};

/**
 * requestAvailabilityHoldAction
 *
 * Buyer initiates hold on a flagged listing.
 */
export async function requestAvailabilityHoldAction(
  listingId: string,
): Promise<AvailabilityHoldActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión para comprar.",
      loginRequired: true,
    };
  }

  const result = await requestAvailabilityHold({
    listingId,
    buyerId: current.profile.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const siteOrigin = await getRequestOrigin();
  await safeNotify(
    notifySellerAvailabilityHoldRequest({
      holdId: result.holdId,
      siteOrigin,
    }),
  );

  revalidatePath(publicListingPath(""));
  revalidatePath("/compras");
  revalidatePath("/notificaciones");
  redirect(`/compras/disponibilidad/${result.holdId}`);
}

/**
 * confirmAvailabilityHoldAction
 *
 * Seller confirms the iPhone is still available.
 */
export async function confirmAvailabilityHoldAction(
  holdId: string,
): Promise<AvailabilityHoldActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión.", loginRequired: true };
  }

  const result = await confirmAvailabilityHold({
    holdId,
    sellerId: current.profile.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const siteOrigin = await getRequestOrigin();
  await safeNotify(
    notifyBuyerAvailabilityHoldConfirmed({ holdId, siteOrigin }),
  );

  revalidatePath("/ventas");
  revalidatePath("/notificaciones");
  revalidatePath(`/ventas/disponibilidad/${holdId}`);
  revalidatePath(`/compras/disponibilidad/${holdId}`);
  return { ok: true };
}

/**
 * denyAvailabilityHoldAction
 *
 * Seller indicates the iPhone is no longer available.
 */
export async function denyAvailabilityHoldAction(
  holdId: string,
): Promise<AvailabilityHoldActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión.", loginRequired: true };
  }

  const hold = await prisma.availabilityHold.findUnique({
    where: { id: holdId },
    select: { listing: { select: { slug: true } } },
  });

  const result = await denyAvailabilityHold({
    holdId,
    sellerId: current.profile.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const siteOrigin = await getRequestOrigin();
  await safeNotify(notifyBuyerAvailabilityHoldDenied({ holdId, siteOrigin }));

  if (hold?.listing.slug) {
    revalidatePath(publicListingPath(hold.listing.slug));
  }
  revalidatePath("/ventas");
  revalidatePath("/notificaciones");
  revalidatePath(`/ventas/disponibilidad/${holdId}`);
  revalidatePath(`/compras/disponibilidad/${holdId}`);
  return { ok: true };
}

/**
 * createOrderFromHoldAction
 *
 * Buyer creates order after seller confirmed availability.
 */
export async function createOrderFromHoldAction(
  holdId: string,
): Promise<AvailabilityHoldActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return {
      ok: false,
      error: "Debes iniciar sesión.",
      loginRequired: true,
    };
  }

  const hold = await prisma.availabilityHold.findFirst({
    where: {
      id: holdId,
      buyerId: current.profile.id,
      status: "CONFIRMED",
      orderId: null,
    },
    include: { listing: { select: { id: true, slug: true } } },
  });

  if (!hold) {
    return {
      ok: false,
      error: "La confirmación no es válida o ya expiró.",
    };
  }

  const orderResult = await createOrderAndReserveListing({
    listingId: hold.listing.id,
    buyerId: current.profile.id,
    availabilityHoldId: holdId,
  });

  if (!orderResult.ok) {
    return { ok: false, error: orderResult.error };
  }

  const linkResult = await linkHoldToOrder({
    holdId,
    buyerId: current.profile.id,
    orderId: orderResult.orderId,
  });

  if (!linkResult.ok) {
    return { ok: false, error: linkResult.error };
  }

  if (hold.listing.slug) {
    revalidatePath(publicListingPath(hold.listing.slug));
  }
  revalidatePath("/compras");
  redirect(`/compras/${orderResult.orderId}`);
}
