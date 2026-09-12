/**
 * @file review-queue-row.tsx
 * @description Linked row for admin/reviewer listing queues with thumbnail and status.
 * @dependencies next/image, next/link, Badge, @/lib/utils
 */

import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ReviewQueueRowProps = {
  href: string;
  title: string;
  sellerName: string;
  submittedAt: string;
  /** Extra queue meta: wait age, assignee. */
  detail?: string;
  imageUrl?: string;
  /** When false, skips the thumbnail well (identity queue has no listing photo). */
  showThumbnail?: boolean;
  statusLabel?: string;
  statusVariant?:
    "secondary" | "outline" | "success" | "warning" | "destructive";
  className?: string;
};

/**
 * ReviewQueueRow
 *
 * Summarizes a listing awaiting review as a navigable queue row.
 *
 * @param props.href - Detail page path for the listing review.
 * @param props.title - Listing title.
 * @param props.sellerName - Seller display name.
 * @param props.submittedAt - Human-readable submission time.
 * @param props.detail - Optional age/assignee line under the timestamp.
 * @param props.imageUrl - Optional thumbnail URL.
 * @param props.showThumbnail - When false, omits the photo well.
 * @param props.statusLabel - Optional status text shown as a Badge.
 * @param props.statusVariant - Badge color; defaults to outline.
 * @param props.className - Optional className.
 * @returns Linked queue row.
 * @calledBy ListingReviewQueuePage and related review lists
 */
export function ReviewQueueRow({
  href,
  title,
  sellerName,
  submittedAt,
  detail,
  imageUrl,
  showThumbnail = true,
  statusLabel,
  statusVariant = "outline",
  className,
}: ReviewQueueRowProps) {
  return (
    <Link
      href={href}
      className={cn(
        "hover:bg-muted/60 border-border flex min-h-20 items-center gap-3 border-b px-2 py-4 transition-colors",
        className,
      )}
    >
      {showThumbnail ? (
        <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : null}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-semibold">
          {title}
        </p>
        <p className="text-muted-foreground truncate text-xs">{sellerName}</p>
        <p className="text-muted-foreground text-xs">{submittedAt}</p>
        {detail ? (
          <p className="text-muted-foreground text-xs">{detail}</p>
        ) : null}
      </div>
      {statusLabel ? (
        <Badge variant={statusVariant} className="shrink-0">
          {statusLabel}
        </Badge>
      ) : null}
    </Link>
  );
}
