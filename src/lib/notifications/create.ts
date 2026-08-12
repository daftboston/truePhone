/**
 * @file create.ts
 * @description Creates idempotent in-app notifications and optional email delivery.
 * @dependencies @prisma/client, prisma, email, preferences, resolve-email
 */

import type { NotificationType } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/notifications/email";
import {
  getNotificationPreferences,
  wantsEmailOrderUpdates,
  wantsInAppOrderUpdates,
} from "@/lib/notifications/preferences";
import { resolveProfileEmail } from "@/lib/notifications/resolve-email";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  orderId?: string | null;
  /** Unique key; retries with the same key are no-ops. */
  dedupeKey: string;
  emailSubject?: string;
  emailText?: string;
  emailHtml?: string;
  siteOrigin?: string;
};

export type CreateNotificationResult =
  | {
      ok: true;
      notificationId: string | null;
      created: boolean;
      emailSent: boolean;
    }
  | { ok: false; error: string };

/**
 * createNotification
 *
 * Persists an idempotent notification row (always, for cron dedupe) and sends
 * email when preferred. In-app-off rows are marked read so badges stay clean.
 * Never throws on email failure after the row exists.
 *
 * @param input - Recipient, type, copy, optional order link, and dedupe key.
 * @returns CreateNotificationResult describing create / email outcomes.
 * @calledBy notifyBuyerReceivedConfirm, processSettlementReminders
 * @consumers Settlement notification flows
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<CreateNotificationResult> {
  const prefs = await getNotificationPreferences(input.userId);
  const wantInApp = wantsInAppOrderUpdates(prefs);
  const wantEmail = wantsEmailOrderUpdates(prefs);

  // Always persist a row for dedupe (cron retries). When in-app is off, mark
  // read immediately so unread badges stay accurate.
  let notificationId: string | null = null;
  let created = false;

  try {
    const row = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        orderId: input.orderId ?? null,
        dedupeKey: input.dedupeKey,
        ...(wantInApp ? {} : { readAt: new Date() }),
      },
      select: { id: true },
    });
    notificationId = row.id;
    created = true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.notification.findUnique({
        where: { dedupeKey: input.dedupeKey },
        select: { id: true, emailSentAt: true },
      });
      if (!existing) {
        return { ok: false, error: "Notificación duplicada." };
      }
      notificationId = existing.id;
      // Already emailed — or email not wanted — fully idempotent exit.
      if (existing.emailSentAt || !wantEmail) {
        return {
          ok: true,
          notificationId,
          created: false,
          emailSent: Boolean(existing.emailSentAt),
        };
      }
    } else {
      throw error;
    }
  }

  // Opted out of both channels: stub row already ensures cron idempotency.
  if (!wantInApp && !wantEmail) {
    return {
      ok: true,
      notificationId,
      created,
      emailSent: false,
    };
  }

  let emailSent = false;
  if (wantEmail) {
    const to = await resolveProfileEmail(input.userId);
    if (to) {
      const absoluteHref =
        input.href && input.siteOrigin
          ? `${input.siteOrigin.replace(/\/$/, "")}${input.href}`
          : null;
      const text =
        input.emailText ??
        (absoluteHref ? `${input.body}\n\n${absoluteHref}` : input.body);
      const subject = input.emailSubject ?? input.title;
      const result = await sendNotificationEmail({
        to,
        subject,
        text,
        html: input.emailHtml,
      });
      if (result.ok && notificationId) {
        emailSent = true;
        await prisma.notification.update({
          where: { id: notificationId },
          data: { emailSentAt: new Date() },
        });
      } else if (!result.ok) {
        console.error("[notifications:email:failed]", result.error);
      }
    }
  }

  return {
    ok: true,
    notificationId,
    created,
    emailSent,
  };
}
