import Link from "next/link";

import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  prevHref?: string | null;
  nextHref?: string | null;
  className?: string;
};

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
