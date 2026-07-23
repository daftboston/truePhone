import Link from "next/link";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import {
  formatOrderMoney,
  orderStatusLabel,
  type OrderListItem,
} from "@/lib/orders";
import { cn } from "@/lib/utils";

type OrderCardProps = {
  order: OrderListItem;
  href: string;
  perspective: "buyer" | "seller";
  className?: string;
};

function partyName(party: OrderListItem["buyer"] | OrderListItem["seller"]) {
  return party.fullName?.trim() || party.username || "Usuario TruePhone";
}

export function OrderCard({
  order,
  href,
  perspective,
  className,
}: OrderCardProps) {
  const imageUrl = order.listing.images[0]?.imageUrl;
  const other = perspective === "buyer" ? order.seller : order.buyer;
  const otherLabel = perspective === "buyer" ? "Vendedor" : "Comprador";

  return (
    <Link
      href={href}
      className={cn(
        "border-border hover:bg-muted/40 flex gap-3 rounded-xl border p-3 transition-colors",
        className,
      )}
    >
      <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-lg">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={order.listing.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-foreground truncate text-sm font-semibold">
            {order.listing.title}
          </p>
          <Badge variant="outline">{orderStatusLabel(order.status)}</Badge>
        </div>
        <p className="text-muted-foreground truncate text-xs">
          {otherLabel}: {partyName(other)}
        </p>
        <p className="text-foreground text-sm font-medium">
          {formatOrderMoney(order.totalPrice, order.currency)}
        </p>
      </div>
    </Link>
  );
}
