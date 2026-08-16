/**
 * @file review-queue-row.tsx
 * @description Linked row for admin/reviewer listing queues with thumbnail and status.
 * @dependencies next/image, next/link, @/lib/utils
 */

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type ReviewQueueRowProps = {
  href: string;
  title: string;
  sellerName: string;
  submittedAt: string;
  imageUrl?: string;
  statusLabel?: string;
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
 * @param props.imageUrl - Optional thumbnail URL.
 * @param props.statusLabel - Optional status text.
 * @param props.className - Optional className.
 * @returns Linked queue row.
 * @calledBy ListingReviewQueuePage and related review lists
 */
export function ReviewQueueRow({
  href,
  title,
  sellerName,
  submittedAt,
  imageUrl,
  statusLabel,
  className,
}: ReviewQueueRowProps) {
  return (
    <Link
      href={href}
      className={cn(
        "hover:bg-muted/60 border-border flex items-center gap-3 border-b px-1 py-3 transition-colors",
        className,
      )}
    >
      <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-semibold">
          {title}
        </p>
        <p className="text-muted-foreground truncate text-xs">{sellerName}</p>
        <p className="text-muted-foreground text-xs">{submittedAt}</p>
      </div>
      {statusLabel && (
        <span className="text-muted-foreground shrink-0 text-xs font-medium">
          {statusLabel}
        </span>
      )}
    </Link>
  );
}
