/**
 * @file queries.ts
 * @description Read / mark-read helpers for the notifications activity center.
 * @dependencies prisma, @/lib/db
 */

import { prisma } from "@/lib/db";

const notificationListSelect = {
  id: true,
  type: true,
  title: true,
  body: true,
  href: true,
  orderId: true,
  readAt: true,
  createdAt: true,
} as const;

export type NotificationListItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  orderId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

/**
 * listNotificationsForUser
 *
 * Returns recent notifications for the activity center (newest first).
 *
 * @param userId - Profile UUID.
 * @param limit - Max rows (default 50).
 * @returns Notification list items.
 * @calledBy /notificaciones page
 */
export async function listNotificationsForUser(
  userId: string,
  limit = 50,
): Promise<NotificationListItem[]> {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
    select: notificationListSelect,
  });
}

/**
 * countUnreadNotifications
 *
 * Counts unread in-app notifications for nav badges.
 *
 * @param userId - Profile UUID.
 * @returns Unread count.
 * @calledBy Account layout / AccountNav
 */
export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

/**
 * markNotificationRead
 *
 * Marks a single notification as read when it belongs to the user.
 *
 * @param input.userId - Profile UUID (owner check).
 * @param input.notificationId - Notification UUID.
 * @returns True when a row was updated.
 * @calledBy markNotificationReadAction
 */
export async function markNotificationRead(input: {
  userId: string;
  notificationId: string;
}) {
  const result = await prisma.notification.updateMany({
    where: {
      id: input.notificationId,
      userId: input.userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  return result.count > 0;
}

/**
 * markAllNotificationsRead
 *
 * Marks every unread notification for a user as read.
 *
 * @param userId - Profile UUID.
 * @returns Number of rows updated.
 * @calledBy markAllNotificationsReadAction
 */
export async function markAllNotificationsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}
