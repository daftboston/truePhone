/**
 * @file order-timeline.tsx
 * @description OrderTimeline component for the orders feature.tsx.
 * @dependencies @/lib/orders, @/lib/utils
 */

import { buildOrderTimeline } from "@/lib/orders";
import { cn } from "@/lib/utils";

type OrderTimelineProps = {
  order: {
    status: Parameters<typeof buildOrderTimeline>[0]["status"];
    createdAt: Date;
    cancelledAt: Date | null;
    completedAt: Date | null;
    paidAt: Date | null;
    fundsHeldAt?: Date | null;
    payoutCompletedAt?: Date | null;
    buyerConfirmedAt?: Date | null;
    buyerConfirmDeadlineAt?: Date | null;
    shipment?: Parameters<typeof buildOrderTimeline>[0]["shipment"];
  };
  className?: string;
};

/**
 * formatWhen
 *
 * Formats a display value for orders UI.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy orders UI and related modules
 */
function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * OrderTimeline
 *
 * Renders the Order Timeline UI for orders.
 *
 * @param props - OrderTimeline props.
 * @returns OrderTimeline React element.
 * @calledBy orders pages and parent components
 */
export function OrderTimeline({ order, className }: OrderTimelineProps) {
  const events = buildOrderTimeline(order);

  return (
    <ol className={cn("space-y-3", className)}>
      {events.map((event) => (
        <li key={event.id} className="flex gap-3">
          <span
            className={cn(
              "mt-1.5 size-2.5 shrink-0 rounded-full",
              event.done ? "bg-primary" : "bg-muted-foreground/40",
            )}
            aria-hidden
          />
          <div className="min-w-0 space-y-0.5">
            <p
              className={cn(
                "text-sm",
                event.done
                  ? "text-foreground font-medium"
                  : "text-muted-foreground",
              )}
            >
              {event.label}
            </p>
            {event.done ? (
              <time
                className="text-muted-foreground text-xs"
                dateTime={event.at.toISOString()}
              >
                {formatWhen(event.at)}
              </time>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
