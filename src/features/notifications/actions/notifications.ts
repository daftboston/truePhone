/**
 * @file notifications.ts
 * @description Server actions for marking notifications read and updating preferences.
 * @dependencies next/cache, auth session, notifications lib
 */

"use server";

import { revalidatePath } from "next/cache";

import type { NotificationActionState } from "@/features/notifications/types";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  markAllNotificationsRead,
  markNotificationRead,
  upsertNotificationPreferences,
} from "@/lib/notifications";

/**
 * markNotificationReadAction
 *
 * Marks one notification as read for the signed-in user.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - notificationId.
 * @returns NotificationActionState.
 * @calledBy NotificationList
 */
export async function markNotificationReadAction(
  _prev: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const notificationId = String(formData.get("notificationId") ?? "");
  if (!notificationId) {
    return { ok: false, error: "Notificación inválida." };
  }

  await markNotificationRead({
    userId: current.profile.id,
    notificationId,
  });
  revalidatePath("/notificaciones");
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * markAllNotificationsReadAction
 *
 * Marks all unread notifications as read for the signed-in user.
 *
 * @param _prev - Previous form state from useActionState.
 * @param _formData - Unused form payload.
 * @returns NotificationActionState with count message.
 * @calledBy NotificationsPage
 */
export async function markAllNotificationsReadAction(
  _prev: NotificationActionState,
  _formData: FormData,
): Promise<NotificationActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  const count = await markAllNotificationsRead(current.profile.id);
  revalidatePath("/notificaciones");
  revalidatePath("/", "layout");
  return {
    ok: true,
    message:
      count === 0
        ? "No había notificaciones sin leer."
        : `Marcaste ${count} como leídas.`,
  };
}

/**
 * updateNotificationPreferencesAction
 *
 * Saves email / in-app preference checkboxes for the signed-in user.
 *
 * @param _prev - Previous form state from useActionState.
 * @param formData - emailEnabled, emailOrderUpdates, inAppEnabled checkboxes.
 * @returns NotificationActionState.
 * @calledBy NotificationPreferencesForm
 */
export async function updateNotificationPreferencesAction(
  _prev: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { ok: false, error: "Debes iniciar sesión." };
  }

  await upsertNotificationPreferences(current.profile.id, {
    emailEnabled: formData.get("emailEnabled") === "on",
    emailOrderUpdates: formData.get("emailOrderUpdates") === "on",
    inAppEnabled: formData.get("inAppEnabled") === "on",
  });

  revalidatePath("/notificaciones");
  return { ok: true, message: "Preferencias guardadas." };
}
