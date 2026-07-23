import { buildOrderTimeline } from "@/lib/orders";
import { cn } from "@/lib/utils";

type OrderTimelineProps = {
  order: {
    status: Parameters<typeof buildOrderTimeline>[0]["status"];
    createdAt: Date;
    cancelledAt: Date | null;
    completedAt: Date | null;
    paidAt: Date | null;
  };
  className?: string;
};

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

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
