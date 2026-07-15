import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TrustBadgeProps = {
  label?: string;
  className?: string;
};

export function TrustBadge({
  label = "Verificado",
  className,
}: TrustBadgeProps) {
  return (
    <Badge variant="trust" className={cn("gap-1", className)}>
      {label}
    </Badge>
  );
}
