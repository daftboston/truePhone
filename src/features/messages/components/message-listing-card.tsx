/**
 * @file message-listing-card.tsx
 * @description Listing context card with a Ver anuncio jump for message threads.
 * @dependencies next/image, next/link, lucide-react, Badge, Button, listingStatusLabel, formatOrderMoney
 */

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ListingStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listingStatusLabel } from "@/features/listings/schemas/listing";
import { formatOrderMoney } from "@/lib/format-money";

type MessageListingCardProps = {
  title: string;
  status: ListingStatus;
  imageUrl?: string | null;
  price?: number | null;
  counterpartName: string;
  href?: string | null;
};

/**
 * statusBadgeVariant
 *
 * Maps listing status to a Badge variant for the thread header.
 *
 * @param status - Listing lifecycle status.
 * @returns Badge variant.
 * @calledBy MessageListingCard
 */
function statusBadgeVariant(status: ListingStatus) {
  if (status === "PUBLISHED") return "trust" as const;
  if (status === "REJECTED") return "destructive" as const;
  if (status === "PENDING_REVIEW" || status === "SUBMITTED") {
    return "warning" as const;
  }
  return "outline" as const;
}

/**
 * MessageListingCard
 *
 * Shows the listing this chat is about, with a clear Ver anuncio action
 * (Facebook-style jump to the publication).
 *
 * @param props.title - Listing title.
 * @param props.status - Listing status for the badge.
 * @param props.imageUrl - Optional gallery thumbnail.
 * @param props.price - Equipment price in COP, if known.
 * @param props.counterpartName - Person in this thread.
 * @param props.href - Role-aware listing destination; omit when none exists.
 * @returns Listing context header for a message thread.
 * @calledBy ThreadView
 */
export function MessageListingCard({
  title,
  status,
  imageUrl,
  price,
  counterpartName,
  href,
}: MessageListingCardProps) {
  const priceLabel =
    price != null && price > 0 ? formatOrderMoney(price) : null;

  return (
    <article className="border-border flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <span className="text-muted-foreground flex size-full items-center justify-center text-[10px] font-medium tracking-wide uppercase">
              iPhone
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-foreground truncate text-sm font-semibold">
            {title}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={statusBadgeVariant(status)}>
              {listingStatusLabel(status)}
            </Badge>
            {priceLabel ? (
              <span className="text-muted-foreground text-xs tabular-nums">
                {priceLabel}
              </span>
            ) : null}
          </div>
          <p className="text-muted-foreground truncate text-xs">
            Conversación con {counterpartName}
          </p>
        </div>
      </div>
      {href ? (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
        >
          <Link href={href}>
            Ver anuncio
            <ArrowUpRight aria-hidden />
          </Link>
        </Button>
      ) : (
        <p className="text-muted-foreground text-xs sm:max-w-40 sm:text-right">
          Este anuncio no está publicado.
        </p>
      )}
    </article>
  );
}
