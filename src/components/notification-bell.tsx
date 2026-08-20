/**
 * @file notification-bell.tsx
 * @description Header link to the activity center with an unread count badge.
 * @dependencies next/link, lucide-react, @/lib/utils
 */

import Link from "next/link";
import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";

type NotificationBellProps = {
  unreadCount: number;
  className?: string;
};

/**
 * formatUnreadBadge
 *
 * Caps the header badge at 9+.
 *
 * @param count - Unread notification count.
 * @returns Display string.
 * @calledBy NotificationBell
 */
function formatUnreadBadge(count: number) {
  return count > 9 ? "9+" : String(count);
}

/**
 * NotificationBell
 *
 * Public-header entry to `/notificaciones`. Hidden for guests (parent omits it).
 *
 * @param props.unreadCount - Unread in-app notifications.
 * @param props.className - Optional wrapper class.
 * @returns Icon link with optional badge.
 * @calledBy AppHeader
 */
export function NotificationBell({
  unreadCount,
  className,
}: NotificationBellProps) {
  return (
    <Link
      href="/notificaciones"
      aria-label={
        unreadCount > 0
          ? `Notificaciones, ${unreadCount} sin leer`
          : "Notificaciones"
      }
      className={cn(
        "text-muted-foreground hover:text-foreground relative inline-flex size-9 items-center justify-center rounded-lg transition-colors",
        className,
      )}
    >
      <Bell className="size-5" aria-hidden />
      {unreadCount > 0 ? (
        <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 min-w-4 rounded-full px-1 text-center text-[10px] leading-4 font-semibold tabular-nums">
          {formatUnreadBadge(unreadCount)}
        </span>
      ) : null}
    </Link>
  );
}
