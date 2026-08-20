/**
 * @file page.tsx
 * @description Activity center: settlement notifications + channel preferences.
 * @dependencies notifications list/prefs, EmptyState
 */

import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { MarkAllReadButton } from "@/features/notifications/components/mark-all-read-button";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { NotificationPreferencesForm } from "@/features/notifications/components/notification-preferences-form";
import { requireCurrentProfile } from "@/lib/auth/session";
import {
  getNotificationPreferences,
  listNotificationsForUser,
} from "@/lib/notifications";

export const metadata: Metadata = {
  title: "Notificaciones",
  description: "Centro de actividad y preferencias de avisos TruePhone.",
};

/**
 * NotificationsPage
 *
 * Lists in-app notifications and lets the user manage email/in-app preferences.
 *
 * @returns Activity center page.
 */
export default async function NotificationsPage() {
  const current = await requireCurrentProfile("/notificaciones");
  const [notifications, prefs] = await Promise.all([
    listNotificationsForUser(current.profile.id),
    getNotificationPreferences(current.profile.id),
  ]);
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Notificaciones
          </h1>
          <p className="text-muted-foreground text-sm">
            Avisos de anuncios, mensajes, envíos y confirmación (24 horas).
            {unread > 0 ? ` Tienes ${unread} sin leer.` : null}
          </p>
        </div>
        {notifications.length > 0 ? <MarkAllReadButton /> : null}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="Sin notificaciones todavía"
          description="Cuando alguien compre, te escriba o un revisor decida sobre tu anuncio, el aviso aparecerá aquí. También te recordamos confirmar el iPhone después de «Ya recibí»."
          action={
            <Button asChild variant="outline">
              <Link href="/compras">Ver compras</Link>
            </Button>
          }
        />
      ) : (
        <NotificationList notifications={notifications} />
      )}

      <section className="border-border space-y-3 rounded-xl border p-4">
        <NotificationPreferencesForm initial={prefs} />
      </section>
    </>
  );
}
