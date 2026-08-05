/**
 * @file review-card.tsx
 * @description Buyer/seller review article with rating, comment, and optional footer.
 * @dependencies ui/avatar, @/lib/utils
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ReviewCardProps = {
  reviewerName: string;
  reviewerAvatarUrl?: string | null;
  rating: number;
  comment?: string | null;
  transactionDate?: Date | null;
  className?: string;
  footer?: React.ReactNode;
};

/**
 * initials
 *
 * Builds up to two-letter initials from a reviewer name.
 *
 * @param name - Reviewer display name.
 * @returns Uppercase initials for AvatarFallback.
 * @calledBy ReviewCard
 */
function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * formatWhen
 *
 * Formats a transaction date for es-CO medium date style.
 *
 * @param date - Transaction Date.
 * @returns Localized date string.
 * @calledBy ReviewCard
 */
function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
  }).format(date);
}

/**
 * ReviewCard
 *
 * Displays a single marketplace review with avatar, stars, and optional footer slot.
 *
 * @param props.reviewerName - Reviewer display name.
 * @param props.reviewerAvatarUrl - Optional avatar URL.
 * @param props.rating - Star rating value.
 * @param props.comment - Optional review body.
 * @param props.transactionDate - Optional date shown under the review.
 * @param props.footer - Optional moderation or action slot.
 * @param props.className - Optional className.
 * @returns Review article element.
 * @calledBy Public profiles and review moderation queues
 */
export function ReviewCard({
  reviewerName,
  reviewerAvatarUrl,
  rating,
  comment,
  transactionDate,
  className,
  footer,
}: ReviewCardProps) {
  return (
    <article
      className={cn("border-border space-y-3 rounded-xl border p-4", className)}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-10">
          {reviewerAvatarUrl ? (
            <AvatarImage src={reviewerAvatarUrl} alt={reviewerName} />
          ) : null}
          <AvatarFallback>{initials(reviewerName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-foreground text-sm font-semibold">
              {reviewerName}
            </p>
            <p
              className="text-foreground text-sm font-medium tabular-nums"
              aria-label={`${rating} de 5 estrellas`}
            >
              {"★".repeat(rating)}
              <span className="text-muted-foreground">
                {"★".repeat(5 - rating)}
              </span>
            </p>
          </div>
          {transactionDate ? (
            <p className="text-muted-foreground text-xs">
              Transacción · {formatWhen(transactionDate)}
            </p>
          ) : null}
        </div>
      </div>
      {comment ? (
        <p className="text-foreground text-sm leading-relaxed">{comment}</p>
      ) : (
        <p className="text-muted-foreground text-sm italic">Sin comentario.</p>
      )}
      {footer}
    </article>
  );
}
