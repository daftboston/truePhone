/**
 * @file availability-hold.ts
 * @description Notifications for multi-platform availability holds (F3).
 */

import { createNotification } from "@/lib/notifications/create";
import { buildNotificationEmail } from "@/lib/notifications/email-template";
import { notificationSiteOrigin } from "@/lib/notifications/marketplace";
import { prisma } from "@/lib/db";
import { publicListingPath } from "@/lib/listings-marketplace";

export function availabilityHoldRequestDedupeKey(holdId: string) {
  return `availability-hold-request:${holdId}`;
}

export function availabilityHoldConfirmedDedupeKey(holdId: string) {
  return `availability-hold-confirmed:${holdId}`;
}

export function availabilityHoldDeniedDedupeKey(holdId: string) {
  return `availability-hold-denied:${holdId}`;
}

export function availabilityHoldExpiredDedupeKey(holdId: string) {
  return `availability-hold-expired:${holdId}`;
}

export function alsoListedReminderDedupeKey(listingId: string) {
  return `also-listed-reminder:${listingId}`;
}

/**
 * notifySellerAvailabilityHoldRequest
 *
 * Alerts seller to confirm availability within 2h.
 */
export async function notifySellerAvailabilityHoldRequest(input: {
  holdId: string;
  siteOrigin?: string;
}) {
  const hold = await prisma.availabilityHold.findUnique({
    where: { id: input.holdId },
    include: {
      listing: {
        select: { id: true, title: true, slug: true, sellerId: true },
      },
      buyer: { select: { fullName: true, username: true } },
    },
  });
  if (!hold) return null;

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const buyerName =
    hold.buyer.fullName?.trim() || hold.buyer.username || "Un comprador";
  const title = "Confirma que el iPhone sigue disponible";
  const body = `${buyerName} quiere comprar «${hold.listing.title}». Confirma en las próximas 2 horas si el equipo sigue disponible antes de que pueda pagar.`;
  const href = `/ventas/disponibilidad/${hold.id}`;

  return createNotification({
    userId: hold.listing.sellerId,
    type: "AVAILABILITY_HOLD_REQUEST",
    title,
    body,
    href,
    dedupeKey: availabilityHoldRequestDedupeKey(hold.id),
    siteOrigin,
    ...buildNotificationEmail({
      subject: "TruePhone: confirma disponibilidad del iPhone",
      title,
      body,
      siteOrigin,
      href,
      ctaLabel: "Responder",
    }),
  });
}

/**
 * notifyBuyerAvailabilityHoldConfirmed
 *
 * Buyer may proceed to checkout.
 */
export async function notifyBuyerAvailabilityHoldConfirmed(input: {
  holdId: string;
  siteOrigin?: string;
}) {
  const hold = await prisma.availabilityHold.findUnique({
    where: { id: input.holdId },
    include: { listing: { select: { title: true } } },
  });
  if (!hold) return null;

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const title = "El vendedor confirmó disponibilidad";
  const body = `Puedes continuar con la compra de «${hold.listing.title}». Tienes unos 30 minutos para pagar.`;
  const href = `/compras/disponibilidad/${hold.id}`;

  return createNotification({
    userId: hold.buyerId,
    type: "AVAILABILITY_HOLD_CONFIRMED",
    title,
    body,
    href,
    dedupeKey: availabilityHoldConfirmedDedupeKey(hold.id),
    siteOrigin,
    ...buildNotificationEmail({
      subject: "TruePhone: puedes continuar tu compra",
      title,
      body,
      siteOrigin,
      href,
      ctaLabel: "Continuar compra",
    }),
  });
}

/**
 * notifyBuyerAvailabilityHoldDenied
 *
 * Listing archived; buyer should explore other listings.
 */
export async function notifyBuyerAvailabilityHoldDenied(input: {
  holdId: string;
  siteOrigin?: string;
}) {
  const hold = await prisma.availabilityHold.findUnique({
    where: { id: input.holdId },
    include: { listing: { select: { title: true } } },
  });
  if (!hold) return null;

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const title = "Este iPhone ya no está disponible";
  const body = `El vendedor indicó que «${hold.listing.title}» ya no está disponible. Puedes explorar otros anuncios similares.`;
  const href = "/buscar";

  return createNotification({
    userId: hold.buyerId,
    type: "AVAILABILITY_HOLD_DENIED",
    title,
    body,
    href,
    dedupeKey: availabilityHoldDeniedDedupeKey(hold.id),
    siteOrigin,
    ...buildNotificationEmail({
      subject: "TruePhone: anuncio no disponible",
      title,
      body,
      siteOrigin,
      href,
      ctaLabel: "Explorar anuncios",
    }),
  });
}

/**
 * notifyBuyerAvailabilityHoldExpired
 *
 * Seller did not respond in time.
 */
export async function notifyBuyerAvailabilityHoldExpired(input: {
  holdId: string;
  siteOrigin?: string;
}) {
  const hold = await prisma.availabilityHold.findUnique({
    where: { id: input.holdId },
    include: { listing: { select: { title: true, slug: true } } },
  });
  if (!hold) return null;

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const title = "Sin respuesta del vendedor";
  const body = `El vendedor no confirmó a tiempo la disponibilidad de «${hold.listing.title}». Puedes intentar de nuevo o explorar otros anuncios.`;
  const href = publicListingPath(hold.listing.slug);

  return createNotification({
    userId: hold.buyerId,
    type: "AVAILABILITY_HOLD_EXPIRED",
    title,
    body,
    href,
    dedupeKey: availabilityHoldExpiredDedupeKey(hold.id),
    siteOrigin,
    ...buildNotificationEmail({
      subject: "TruePhone: solicitud de disponibilidad vencida",
      title,
      body,
      siteOrigin,
      href,
      ctaLabel: "Ver anuncio",
    }),
  });
}

/**
 * notifySellerAlsoListedReminder
 *
 * Reminder when publishing with alsoListedElsewhere flag.
 */
export async function notifySellerAlsoListedReminder(input: {
  listingId: string;
  siteOrigin?: string;
}) {
  const listing = await prisma.listing.findUnique({
    where: { id: input.listingId },
    select: {
      id: true,
      sellerId: true,
      title: true,
      alsoListedElsewhere: true,
    },
  });
  if (!listing?.alsoListedElsewhere) return null;

  const siteOrigin = input.siteOrigin ?? notificationSiteOrigin();
  const title = "Recuerda pausar si vendes en otro sitio";
  const body =
    "Si vendes este iPhone en otra plataforma, retira o pausa tu anuncio en TruePhone de inmediato para evitar que se venda dos veces. Gracias.";
  const href = `/vender/${listing.id}`;

  return createNotification({
    userId: listing.sellerId,
    type: "ALSO_LISTED_REMINDER",
    title,
    body,
    href,
    dedupeKey: alsoListedReminderDedupeKey(listing.id),
    siteOrigin,
    ...buildNotificationEmail({
      subject: "TruePhone: recuerda actualizar tu anuncio",
      title,
      body,
      siteOrigin,
      href,
      ctaLabel: "Ver anuncio",
    }),
  });
}
