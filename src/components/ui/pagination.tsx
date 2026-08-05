/**
 * @file pagination.tsx
 * @description Prev/next pagination nav for search and browse result pages.
 * @dependencies next/link, @/lib/utils
 */

import Link from "next/link";

import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  prevHref?: string | null;
  nextHref?: string | null;
  className?: string;
};

/**
 * Pagination
 *
 * Renders page indicator and Anterior/Siguiente links; hidden when totalPages <= 1.
 *
 * @param props.page - Current 1-based page.
 * @param props.totalPages - Total pages available.
 * @param props.prevHref - Previous page href, or null when disabled.
 * @param props.nextHref - Next page href, or null when disabled.
 * @param props.className - Optional className.
 * @returns Pagination nav or null.
 * @calledBy Search and explore result lists
 */
export function Pagination({
  page,
  totalPages,
  prevHref,
  nextHref,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

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
      <span>
        Página {page} de {totalPages}
      </span>
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
