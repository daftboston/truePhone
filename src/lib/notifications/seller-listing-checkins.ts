/**
 * @file seller-listing-checkins.ts
 * @description Day 7 / 14 seller listing check-in cron processor (F2).
 */

import { createNotification } from "@/lib/notifications/create";
import { buildNotificationEmail } from "@/lib/notifications/email-template";
import { notificationSiteOrigin } from "@/lib/notifications/marketplace";
import { prisma } from "@/lib/db";

export function listingCheckinDay7DedupeKey(listingId: string) {
  return `listing-checkin-day7:${listingId}`;
}

export function listingCheckinDay14DedupeKey(listingId: string) {
  return `listing-checkin-day14:${listingId}`;
}

/**
 * bogotaDateParts
 *
 * Returns Y-M-D in America/Bogota for milestone matching.
 */
function bogotaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return { year, month, day };
}

/**
 * addDaysBogota
 *
 * Adds calendar days to a Bogota-local date (no catch-up spam).
 */
function addDaysBogota(base: Date, days: number): Date {
  const { year, month, day } = bogotaDateParts(base);
  const utc = new Date(`${year}-${month}-${day}T12:00:00-05:00`);
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc;
}

/**
 * isMilestoneToday
 *
 * True when publishedAt + milestoneDays falls on today's Bogota date.
 */
export function isMilestoneToday(
  publishedAt: Date,
  milestoneDays: number,
  now = new Date(),
): boolean {
  const target = addDaysBogota(publishedAt, milestoneDays);
  const targetParts = bogotaDateParts(target);
  const todayParts = bogotaDateParts(now);
  return (
    targetParts.year === todayParts.year &&
    targetParts.month === todayParts.month &&
    targetParts.day === todayParts.day
  );
}

async function notifyCheckin(input: {
  listingId: string;
  sellerId: string;
  title: string;
  type: "LISTING_CHECKIN_DAY7" | "LISTING_CHECKIN_DAY14";
  dedupeKey: string;
  emailSubject: string;
  notificationTitle: string;
  body: string;
  siteOrigin: string;
}) {
  const href = `/vender/${input.listingId}`;
  return createNotification({
    userId: input.sellerId,
    type: input.type,
    title: input.notificationTitle,
    body: input.body,
    href,
    dedupeKey: input.dedupeKey,
    siteOrigin: input.siteOrigin,
    ...buildNotificationEmail({
      subject: input.emailSubject,
      title: input.notificationTitle,
      body: input.body,
      siteOrigin: input.siteOrigin,
      href,
      ctaLabel: "Ver anuncio",
    }),
  });
}

/**
 * processSellerListingCheckins
 *
 * Sends day-7 and day-14 check-ins for eligible published listings.
 */
export async function processSellerListingCheckins(options: {
  limit?: number;
  siteOrigin?: string;
}) {
  const limit = options.limit ?? 100;
  const siteOrigin = options.siteOrigin ?? notificationSiteOrigin();
  const now = new Date();

  const listings = await prisma.listing.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { not: null },
    },
    select: {
      id: true,
      title: true,
      sellerId: true,
      views: true,
      publishedAt: true,
      slug: true,
    },
    take: limit,
    orderBy: { publishedAt: "asc" },
  });

  const results: { listingId: string; milestone: string; ok: boolean }[] = [];

  for (const listing of listings) {
    const publishedAt = listing.publishedAt!;
    const viewsLine =
      listing.views > 0
        ? `Tu anuncio tiene ${listing.views} vista${listing.views === 1 ? "" : "s"} únicas.`
        : "Tu anuncio aún sin vistas.";

    if (isMilestoneToday(publishedAt, 7, now)) {
      try {
        await notifyCheckin({
          listingId: listing.id,
          sellerId: listing.sellerId,
          title: listing.title,
          type: "LISTING_CHECKIN_DAY7",
          dedupeKey: listingCheckinDay7DedupeKey(listing.id),
          emailSubject: "TruePhone: cómo va tu anuncio",
          notificationTitle: "Tu anuncio lleva una semana publicado",
          body: `${viewsLine} Revisa fotos y descripción; responder preguntas ayuda a generar confianza.`,
          siteOrigin,
        });
        results.push({ listingId: listing.id, milestone: "day7", ok: true });
      } catch {
        results.push({ listingId: listing.id, milestone: "day7", ok: false });
      }
    }

    if (isMilestoneToday(publishedAt, 14, now)) {
      try {
        await notifyCheckin({
          listingId: listing.id,
          sellerId: listing.sellerId,
          title: listing.title,
          type: "LISTING_CHECKIN_DAY14",
          dedupeKey: listingCheckinDay14DedupeKey(listing.id),
          emailSubject: "TruePhone: ¿revisar el precio?",
          notificationTitle: "Llevas dos semanas con este anuncio",
          body: `Si quieres, revisa el precio de «${listing.title}». A veces un pequeño ajuste ayuda. La visibilidad puede variar según señales de calidad y precio del mercado.`,
          siteOrigin,
        });
        results.push({ listingId: listing.id, milestone: "day14", ok: true });
      } catch {
        results.push({ listingId: listing.id, milestone: "day14", ok: false });
      }
    }
  }

  return results;
}
