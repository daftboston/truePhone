/**
 * @file mark-all-read-button.tsx
 * @description Client button that marks all notifications as read.
 * @dependencies useActionState, markAllNotificationsReadAction, Button
 */

"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { markAllNotificationsReadAction } from "@/features/notifications/actions/notifications";
import type { NotificationActionState } from "@/features/notifications/types";

/**
 * MarkAllReadButton
 *
 * Submits mark-all-read for the signed-in user's activity center.
 *
 * @returns Form with submit button and optional status message.
 * @calledBy NotificationsPage
 */
export function MarkAllReadButton() {
  const [state, action, pending] = useActionState(
    markAllNotificationsReadAction,
    null as NotificationActionState,
  );

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Marcando…" : "Marcar todas como leídas"}
      </Button>
      {state?.ok === true && state.message ? (
        <p className="text-muted-foreground text-xs" role="status">
          {state.message}
        </p>
      ) : null}
      {state?.ok === false ? (
        <p className="text-destructive text-xs" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
