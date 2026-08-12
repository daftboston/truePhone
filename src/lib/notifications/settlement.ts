/**
 * @file settlement.ts
 * @description Settlement-critical buyer confirm notifications (received + 24h reminders).
 * @dependencies prisma, createNotification, FINANCIAL_MODEL §5.1
 */

import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications/create";

/** Hours before deadline when the reminder cron should nudge the buyer. */
export const CONFIRM_REMINDER_LEAD_HOURS = 6;

/**
 * buyerReceivedDedupeKey
 *
 * Builds the idempotency key for the post-receipt confirm notification.
 *
 * @param orderId - Order UUID.
 * @returns Dedupe key string.
 * @calledBy notifyBuyerReceivedConfirm
 */
export function buyerReceivedDedupeKey(orderId: string) {
  return `buyer-received:${orderId}`;
}

/**
 * buyerConfirmReminderDedupeKey
 *
 * Builds the idempotency key for the pre-deadline reminder.
 *
 * @param orderId - Order UUID.
 * @returns Dedupe key string.
 * @calledBy processSettlementReminders
 */
export function buyerConfirmReminderDedupeKey(orderId: string) {
  return `buyer-confirm-reminder:${orderId}`;
}

/**
 * formatDeadlineEsCo
 *
 * Formats a confirm deadline for Spanish (Colombia) UX / email copy.
 *
 * @param deadline - Absolute deadline Date.
 * @returns Localized date-time string.
 * @calledBy notifyBuyerReceivedConfirm, processSettlementReminders
 */
export function formatDeadlineEsCo(deadline: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(deadline);
}

/**
 * isOrderEligibleForConfirmReminder
 *
 * Pure eligibility check: PAID hold, clock started, not confirmed, not frozen,
 * deadline still in the future, and within the reminder lead window.
 *
 * @param order - Minimal order settlement fields.
 * @param now - Reference time (injectable for tests).
 * @param leadHours - Hours before deadline to start reminding (default 6).
 * @returns True when a reminder should be considered.
 * @calledBy processSettlementReminders, unit tests
 */
export function isOrderEligibleForConfirmReminder(
  order: {
    status: string;
    buyerConfirmedAt: Date | null;
    buyerConfirmDeadlineAt: Date | null;
    payoutFrozen: boolean;
  },
  now: Date = new Date(),
  leadHours = CONFIRM_REMINDER_LEAD_HOURS,
): boolean {
  if (order.status !== "PAID") return false;
  if (order.payoutFrozen) return false;
  if (order.buyerConfirmedAt) return false;
  if (!order.buyerConfirmDeadlineAt) return false;

  const deadlineMs = order.buyerConfirmDeadlineAt.getTime();
  const nowMs = now.getTime();
  if (deadlineMs <= nowMs) return false;

  const leadMs = leadHours * 60 * 60 * 1000;
  return deadlineMs - nowMs <= leadMs;
}

/**
 * notifyBuyerReceivedConfirm
 *
 * Sends in-app + email after the buyer marks «Ya recibí»: confirm CTA and 24h
 * disclosure (FINANCIAL_MODEL §5.1 / Phase 12).
 *
 * @param input.orderId - Order that just started the confirm window.
 * @param input.siteOrigin - Absolute origin for email deep links.
 * @returns createNotification result, or skipped when order not ready.
 * @calledBy markOrderReceivedByBuyer
 * @consumers Buyer activity center + email inbox
 */
export async function notifyBuyerReceivedConfirm(input: {
  orderId: string;
  siteOrigin: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      buyerId: true,
      buyerConfirmDeadlineAt: true,
      listing: { select: { title: true } },
    },
  });

  if (!order?.buyerConfirmDeadlineAt) {
    return { ok: true as const, skipped: true as const };
  }

  const deadlineLabel = formatDeadlineEsCo(order.buyerConfirmDeadlineAt);
  const href = `/compras/${order.id}`;
  const listingLabel = order.listing.title;
  const title = "Confirma tu iPhone en 24 horas";
  const body = `Registramos que recibiste «${listingLabel}». Tienes hasta el ${deadlineLabel} para confirmar que coincide con el anuncio o reportar un problema. Si no reportas nada, TruePhone pagará al vendedor.`;

  const result = await createNotification({
    userId: order.buyerId,
    type: "BUYER_RECEIVED_CONFIRM",
    title,
    body,
    href,
    orderId: order.id,
    dedupeKey: buyerReceivedDedupeKey(order.id),
    siteOrigin: input.siteOrigin,
    emailSubject: "TruePhone: confirma tu iPhone en 24 horas",
    emailText: [
      body,
      "",
      "Abre tu pedido para confirmar o reportar un problema:",
      `${input.siteOrigin.replace(/\/$/, "")}${href}`,
      "",
      "La batería con caída ≤1% no es motivo de reporte (Términos).",
    ].join("\n"),
  });

  return { ...result, skipped: false as const };
}

/**
 * processSettlementReminders
 *
 * Cron job: nudges buyers whose 24h confirm window ends within the lead period.
 * Idempotent per order via dedupe keys.
 *
 * @param limit - Max orders to process this run (default 50).
 * @param now - Reference time (injectable for tests).
 * @param siteOrigin - Absolute origin for email links.
 * @returns Per-order outcomes.
 * @calledBy GET /api/cron/settlement-reminders
 */
export async function processSettlementReminders(input?: {
  limit?: number;
  now?: Date;
  siteOrigin?: string;
}) {
  const now = input?.now ?? new Date();
  const limit = input?.limit ?? 50;
  const siteOrigin =
    input?.siteOrigin ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const leadMs = CONFIRM_REMINDER_LEAD_HOURS * 60 * 60 * 1000;
  const windowEnd = new Date(now.getTime() + leadMs);

  const candidates = await prisma.order.findMany({
    where: {
      status: "PAID",
      payoutFrozen: false,
      buyerConfirmedAt: null,
      buyerConfirmDeadlineAt: {
        gt: now,
        lte: windowEnd,
      },
    },
    take: limit,
    orderBy: { buyerConfirmDeadlineAt: "asc" },
    select: {
      id: true,
      buyerId: true,
      buyerConfirmDeadlineAt: true,
      listing: { select: { title: true } },
    },
  });

  const results: Array<{
    orderId: string;
    ok: boolean;
    created?: boolean;
    emailSent?: boolean;
    error?: string;
  }> = [];

  for (const order of candidates) {
    if (!order.buyerConfirmDeadlineAt) continue;

    const deadlineLabel = formatDeadlineEsCo(order.buyerConfirmDeadlineAt);
    const href = `/compras/${order.id}`;
    const title = "Quedan pocas horas para confirmar tu iPhone";
    const body = `Tu ventana de 24 horas para «${order.listing.title}» cierra el ${deadlineLabel}. Confirma que el dispositivo coincide con el anuncio o reporta un problema. Si no haces nada, TruePhone pagará al vendedor.`;

    const result = await createNotification({
      userId: order.buyerId,
      type: "BUYER_CONFIRM_REMINDER",
      title,
      body,
      href,
      orderId: order.id,
      dedupeKey: buyerConfirmReminderDedupeKey(order.id),
      siteOrigin,
      emailSubject: "TruePhone: quedan pocas horas para confirmar tu iPhone",
      emailText: [
        body,
        "",
        "Abre tu pedido:",
        `${siteOrigin.replace(/\/$/, "")}${href}`,
      ].join("\n"),
    });

    if (!result.ok) {
      results.push({ orderId: order.id, ok: false, error: result.error });
    } else {
      results.push({
        orderId: order.id,
        ok: true,
        created: result.created,
        emailSent: result.emailSent,
      });
    }
  }

  return results;
}
