import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  className?: string;
};

export function Pagination({ page, totalPages, className }: PaginationProps) {
  return (
    <nav
      className={cn(
        "text-muted-foreground flex items-center justify-center gap-2 text-sm",
        className,
      )}
      aria-label="Paginación"
    >
      <span>
        Página {page} de {totalPages}
      </span>
    </nav>
  );
}
