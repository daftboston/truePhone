/**
 * @file seller-price-guide.tsx
 * @description Read-only recommended price reference for the sell wizard price step.
 * @dependencies @/lib/format-money, @/features/recommended-prices/types
 */

import { formatOrderMoney } from "@/lib/format-money";
import type { SellerPriceGuideEntry } from "@/features/recommended-prices/types";

type SellerPriceGuideProps = {
  /** Effective guide for the selected model + storage + condition, if any. */
  entry: SellerPriceGuideEntry | null;
};

/**
 * SellerPriceGuide
 *
 * Shows admin-maintained COP reference (and optional band) next to the listing
 * price input. Guidance only — never validates or blocks publish.
 *
 * @param props.entry - Matched guide row, or null when incomplete / missing.
 * @returns Guide callout when `entry` is set; null otherwise.
 * @calledBy DeviceDetailsForm
 */
export function SellerPriceGuide({ entry }: SellerPriceGuideProps) {
  if (!entry) return null;

  const hasBand = entry.minPriceCop != null || entry.maxPriceCop != null;
  const bandLabel = hasBand
    ? `${entry.minPriceCop != null ? formatOrderMoney(entry.minPriceCop) : "—"} – ${entry.maxPriceCop != null ? formatOrderMoney(entry.maxPriceCop) : "—"}`
    : null;

  return (
    <div
      className="border-border bg-muted/40 space-y-1.5 rounded-xl border p-3"
      role="status"
      aria-live="polite"
    >
      <p className="text-foreground text-sm font-semibold">
        Precio de referencia
      </p>
      <p className="text-foreground text-base font-semibold tabular-nums">
        {formatOrderMoney(entry.priceCop)}
      </p>
      {bandLabel ? (
        <p className="text-muted-foreground text-xs tabular-nums">
          Rango orientativo: {bandLabel}
        </p>
      ) : null}
      <p className="text-muted-foreground text-xs leading-relaxed">
        Es una guía de mercado para tu combinación. Tú eliges el precio del
        anuncio; no es obligatorio.
      </p>
    </div>
  );
}
