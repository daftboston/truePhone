/**
 * @file notification-preferences-form.tsx
 * @description Client form for email / in-app notification preferences.
 * @dependencies useActionState, updateNotificationPreferencesAction
 */

"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { updateNotificationPreferencesAction } from "@/features/notifications/actions/notifications";
import type { NotificationActionState } from "@/features/notifications/types";
import type { NotificationPrefs } from "@/lib/notifications";

type NotificationPreferencesFormProps = {
  initial: NotificationPrefs;
};

/**
 * NotificationPreferencesForm
 *
 * Saves channel preferences (email master, order emails, in-app).
 *
 * @param props.initial - Current preference flags.
 * @returns Preferences form UI.
 * @calledBy NotificationsPage
 */
export function NotificationPreferencesForm({
  initial,
}: NotificationPreferencesFormProps) {
  const [state, action, pending] = useActionState(
    updateNotificationPreferencesAction,
    null as NotificationActionState,
  );

  return (
    <form action={action} className="space-y-4">
      <fieldset className="space-y-3">
        <legend className="text-foreground text-sm font-semibold">
          Preferencias
        </legend>
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            name="inAppEnabled"
            defaultChecked={initial.inAppEnabled}
            className="mt-0.5 size-4 rounded border"
          />
          <span>
            <span className="text-foreground font-medium">En la app</span>
            <span className="text-muted-foreground block text-xs">
              Mostrar avisos en el centro de actividad.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            name="emailEnabled"
            defaultChecked={initial.emailEnabled}
            className="mt-0.5 size-4 rounded border"
          />
          <span>
            <span className="text-foreground font-medium">Correo</span>
            <span className="text-muted-foreground block text-xs">
              Recibir notificaciones por email.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            name="emailOrderUpdates"
            defaultChecked={initial.emailOrderUpdates}
            className="mt-0.5 size-4 rounded border"
          />
          <span>
            <span className="text-foreground font-medium">
              Actualizaciones de pedidos
            </span>
            <span className="text-muted-foreground block text-xs">
              Incluye confirmación tras «Ya recibí» y recordatorios de 24 horas.
            </span>
          </span>
        </label>
      </fieldset>

      {state?.ok === false ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true && state.message ? (
        <p className="text-trust text-sm" role="status">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Guardando…" : "Guardar preferencias"}
      </Button>
    </form>
  );
}
