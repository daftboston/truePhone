import { cn } from "@/lib/utils";

type PriceDisplayProps = {
  price: number;
  equipmentPrice?: number;
  protectionFee?: number;
  currency?: string;
  className?: string;
};

function formatCop(value: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function PriceDisplay({
  price,
  equipmentPrice,
  protectionFee,
  currency = "COP",
  className,
}: PriceDisplayProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-foreground text-2xl font-semibold tracking-tight">
        {formatCop(price, currency)}
      </p>
      {(equipmentPrice != null || protectionFee != null) && (
        <dl className="text-muted-foreground space-y-0.5 text-sm">
          {equipmentPrice != null && (
            <div className="flex justify-between gap-4">
              <dt>Equipo</dt>
              <dd>{formatCop(equipmentPrice, currency)}</dd>
            </div>
          )}
          {protectionFee != null && (
            <div className="flex justify-between gap-4">
              <dt>Protección TruePhone</dt>
              <dd>{formatCop(protectionFee, currency)}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
