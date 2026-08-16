/**
 * @file notification-list.tsx
 * @description Activity-center list of in-app notifications with mark-read.
 * @dependencies next/link, markNotificationReadAction, NotificationListItem
 */

"use client";

import Link from "next/link";
import { useActionState } from "react";

import { markNotificationReadAction } from "@/features/notifications/actions/notifications";
import type { NotificationActionState } from "@/features/notifications/types";
import type { NotificationListItem } from "@/lib/notifications";
import { cn } from "@/lib/utils";

type NotificationListProps = {
  notifications: NotificationListItem[];
  className?: string;
};

/**
 * formatWhen
 *
 * Formats notification timestamps for es-CO display.
 *
 * @param date - Created-at timestamp.
 * @returns Localized short date-time.
 * @calledBy NotificationList
 */
function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

/**
 * NotificationRow
 *
 * Single notification row: link to order (if any) and mark-as-read control.
 *
 * @param props.item - Notification list item.
 * @returns List item element.
 * @calledBy NotificationList
 */
function NotificationRow({ item }: { item: NotificationListItem }) {
  const [, action, pending] = useActionState(
    markNotificationReadAction,
    null as NotificationActionState,
  );
  const unread = !item.readAt;
  const content = (
    <div className="min-w-0 flex-1 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <p
          className={cn(
            "text-sm",
            unread ? "text-foreground font-semibold" : "text-foreground",
          )}
        >
          {item.title}
        </p>
        {unread ? (
          <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
            Nueva
          </span>
        ) : null}
      </div>
      <p className="text-muted-foreground text-sm">{item.body}</p>
      <p className="text-muted-foreground text-xs">
        {formatWhen(item.createdAt)}
      </p>
    </div>
  );

  return (
    <li
      className={cn(
        "flex flex-col gap-3 p-4 sm:flex-row sm:items-start",
        unread && "bg-primary/5",
      )}
    >
      {item.href ? (
        <Link
          href={item.href}
          className="min-w-0 flex-1 hover:opacity-90"
          onClick={() => {
            if (unread) {
              const fd = new FormData();
              fd.set("notificationId", item.id);
              void action(fd);
            }
          }}
        >
          {content}
        </Link>
      ) : (
        content
      )}
      {unread ? (
        <form action={action}>
          <input type="hidden" name="notificationId" value={item.id} />
          <button
            type="submit"
            disabled={pending}
            className="text-muted-foreground hover:text-foreground shrink-0 text-xs font-medium underline-offset-2 hover:underline disabled:opacity-50"
          >
            Marcar leída
          </button>
        </form>
      ) : null}
    </li>
  );
}

/**
 * NotificationList
 *
 * Renders the activity-center notification list.
 *
 * @param props.notifications - Ordered notification items.
 * @param props.className - Optional list wrapper classes.
 * @returns Unordered list of notifications.
 * @calledBy NotificationsPage
 */
export function NotificationList({
  notifications,
  className,
}: NotificationListProps) {
  return (
    <ul
      className={cn(
        "divide-border border-border divide-y rounded-xl border",
        className,
      )}
    >
      {notifications.map((item) => (
        <NotificationRow key={item.id} item={item} />
      ))}
    </ul>
  );
}
