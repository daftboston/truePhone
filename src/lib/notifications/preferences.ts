/**
 * @file preferences.ts
 * @description Loads and upserts per-user notification channel preferences.
 * @dependencies prisma, @/lib/db
 */

import { prisma } from "@/lib/db";

export type NotificationPrefs = {
  emailEnabled: boolean;
  emailOrderUpdates: boolean;
  inAppEnabled: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  emailEnabled: true,
  emailOrderUpdates: true,
  inAppEnabled: true,
};

/**
 * getNotificationPreferences
 *
 * Returns stored preferences for a profile, or product defaults when none exist.
 *
 * @param userId - Profile UUID.
 * @returns Channel preference flags.
 * @calledBy createNotification, preferences UI
 */
export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPrefs> {
  const row = await prisma.notificationPreference.findUnique({
    where: { userId },
    select: {
      emailEnabled: true,
      emailOrderUpdates: true,
      inAppEnabled: true,
    },
  });
  if (!row) return { ...DEFAULT_PREFS };
  return row;
}

/**
 * upsertNotificationPreferences
 *
 * Creates or updates notification preferences for a profile.
 *
 * @param userId - Profile UUID.
 * @param prefs - Partial preference flags to merge onto defaults / existing.
 * @returns Persisted preference row fields.
 * @calledBy updateNotificationPreferencesAction
 */
export async function upsertNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPrefs>,
) {
  const current = await getNotificationPreferences(userId);
  const next: NotificationPrefs = {
    emailEnabled: prefs.emailEnabled ?? current.emailEnabled,
    emailOrderUpdates: prefs.emailOrderUpdates ?? current.emailOrderUpdates,
    inAppEnabled: prefs.inAppEnabled ?? current.inAppEnabled,
  };

  return prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...next },
    update: next,
    select: {
      emailEnabled: true,
      emailOrderUpdates: true,
      inAppEnabled: true,
    },
  });
}

/**
 * wantsInAppOrderUpdates
 *
 * Whether in-app settlement / order notifications should be persisted.
 *
 * @param prefs - Preference flags.
 * @returns True when in-app channel is enabled.
 * @calledBy createNotification
 */
export function wantsInAppOrderUpdates(prefs: NotificationPrefs) {
  return prefs.inAppEnabled;
}

/**
 * wantsEmailOrderUpdates
 *
 * Whether email settlement / order notifications should be sent.
 *
 * @param prefs - Preference flags.
 * @returns True when email + order-update flags are enabled.
 * @calledBy createNotification
 */
export function wantsEmailOrderUpdates(prefs: NotificationPrefs) {
  return prefs.emailEnabled && prefs.emailOrderUpdates;
}
