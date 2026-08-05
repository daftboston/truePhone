/**
 * @file price-display.tsx
 * @description Formats COP prices with optional equipment and protection fee breakdown.
 * @dependencies @/lib/utils
 */

import { cn } from "@/lib/utils";

type PriceDisplayProps = {
  price: number;
  equipmentPrice?: number;
  protectionFee?: number;
  currency?: string;
  className?: string;
};

/**
 * formatCop
 *
 * Formats a numeric amount as Colombian peso currency.
 *
 * @param value - Amount in COP units.
 * @param currency - ISO currency code; defaults to COP.
 * @returns Localized currency string (es-CO).
 * @calledBy PriceDisplay
 */
function formatCop(value: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * PriceDisplay
 *
 * Shows the buyer-facing total with optional Equipo / Protección line items.
 *
 * @param props.price - Total amount to emphasize.
 * @param props.equipmentPrice - Optional equipment portion.
 * @param props.protectionFee - Optional TruePhone protection fee.
 * @param props.currency - Currency code; defaults to COP.
 * @param props.className - Wrapper className.
 * @returns Price block with optional breakdown list.
 * @calledBy ListingCard, HomeFeaturedRotator, listing detail pages
 */
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
