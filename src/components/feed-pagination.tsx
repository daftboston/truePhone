/**
 * @file feed-pagination.tsx
 * @description Prev/next navigation for cursor-paginated listing feeds.
 * @dependencies next/link, @/lib/utils
 */

import Link from "next/link";

import { cn } from "@/lib/utils";

type FeedPaginationProps = {
  prevHref?: string | null;
  nextHref?: string | null;
  className?: string;
};

/**
 * FeedPagination
 *
 * Renders Anterior/Siguiente links for keyset-paginated feeds.
 *
 * @param props.prevHref - Previous page href or null when disabled.
 * @param props.nextHref - Next page href or null when disabled.
 * @param props.className - Optional className.
 * @returns Pagination nav or null when both links are absent.
 */
export function FeedPagination({
  prevHref,
  nextHref,
  className,
}: FeedPaginationProps) {
  if (!prevHref && !nextHref) return null;

  return (
    <nav
      className={cn(
        "text-muted-foreground flex items-center justify-center gap-3 text-sm",
        className,
      )}
      aria-label="Paginación"
    >
      {prevHref ? (
        <Link
          href={prevHref}
          className="text-foreground hover:bg-muted rounded-lg border px-3 py-1.5 font-medium"
        >
          Anterior
        </Link>
      ) : (
        <span className="rounded-lg border px-3 py-1.5 opacity-40">
          Anterior
        </span>
      )}
      {nextHref ? (
        <Link
          href={nextHref}
          className="text-foreground hover:bg-muted rounded-lg border px-3 py-1.5 font-medium"
        >
          Siguiente
        </Link>
      ) : (
        <span className="rounded-lg border px-3 py-1.5 opacity-40">
          Siguiente
        </span>
      )}
    </nav>
  );
}
