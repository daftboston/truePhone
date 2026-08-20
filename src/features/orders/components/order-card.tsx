/**
 * @file order-card.tsx
 * @description OrderCard component for the orders feature.tsx.
 * @dependencies next/link, next/image, @/components/ui/badge, @/lib/orders, @/lib/utils
 */

import Link from "next/link";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { buyerCanChooseRefundOrLoyalty } from "@/lib/financial-core/buyer-abandon-choice";
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

/**
 * partyName
 *
 * Supports orders by implementing partyName.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy orders UI and related modules
 */
function partyName(party: OrderListItem["buyer"] | OrderListItem["seller"]) {
  return party.fullName?.trim() || party.username || "Usuario TruePhone";
}

/**
 * OrderCard
 *
 * Renders the Order Card UI for orders.
 *
 * @param props - OrderCard props.
 * @returns OrderCard React element.
 * @calledBy orders pages and parent components
 */
export function OrderCard({
  order,
  href,
  perspective,
  className,
}: OrderCardProps) {
  const imageUrl = order.listing.images[0]?.imageUrl;
  const other = perspective === "buyer" ? order.seller : order.buyer;
  const otherLabel = perspective === "buyer" ? "Vendedor" : "Comprador";
  const needsChoice = buyerCanChooseRefundOrLoyalty({
    orderStatus: order.status,
    isBuyer: perspective === "buyer",
    entitlement: order.feeEntitlementSource,
  });

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
        {needsChoice ? (
          <p className="text-trust text-xs font-medium">
            Elige reembolso o compra al 8%
          </p>
        ) : null}
      </div>
    </Link>
  );
}
