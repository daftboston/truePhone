"use client";

/**
 * @file price-display.tsx
 * @description Formats COP prices with optional equipment and protection fee breakdown.
 * @dependencies @/lib/utils
 * @changelog 2026-09-14 — Structured checkout breakdown for legal Priority A.
 */

import { cn } from "@/lib/utils";

type PriceDisplayProps = {
  price: number;
  equipmentPrice?: number;
  protectionFee?: number;
  feePercent?: number;
  protectionLabel?: string;
  /** When true, shows the full pre-pay fee breakdown for checkout surfaces. */
  variant?: "default" | "checkout";
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
 * Shows the buyer-facing total with optional Equipo / Protección line items,
 * or a structured checkout breakdown when variant is checkout.
 *
 * @param props.price - Total amount to emphasize.
 * @param props.equipmentPrice - Optional equipment portion.
 * @param props.protectionFee - Optional TruePhone protection fee.
 * @param props.feePercent - Protection percent for checkout breakdown label.
 * @param props.protectionLabel - Optional fee-row label override (default variant).
 * @param props.variant - default or checkout structured breakdown.
 * @param props.currency - Currency code; defaults to COP.
 * @param props.className - Wrapper className.
 * @returns Price block with optional breakdown list.
 * @calledBy ListingCard, listing detail pages, order checkout
 */
export function PriceDisplay({
  price,
  equipmentPrice,
  protectionFee,
  feePercent,
  protectionLabel = "Protección TruePhone",
  variant = "default",
  currency = "COP",
  className,
}: PriceDisplayProps) {
  const showCheckoutBreakdown =
    variant === "checkout" &&
    equipmentPrice != null &&
    protectionFee != null &&
    feePercent != null;

  if (showCheckoutBreakdown) {
    return (
      <div className={cn("space-y-3", className)}>
        <dl className="text-muted-foreground space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt>Precio del iPhone</dt>
            <dd className="text-foreground">
              {formatCop(equipmentPrice, currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>
              Protección TruePhone (Compra Garantizada)
              {protectionLabel !== "Protección TruePhone" ? (
                <span className="block text-xs font-normal">
                  {protectionLabel}
                </span>
              ) : null}
            </dt>
            <dd className="text-foreground text-right">
              {formatCop(protectionFee, currency)}
              <span className="block text-xs font-normal">
                ({feePercent}% sobre el precio del anuncio)
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Envío</dt>
            <dd className="text-foreground max-w-[14rem] text-right text-xs leading-relaxed">
              lo asume el vendedor (no se cobra al comprador en este checkout)
            </dd>
          </div>
          <div className="border-border flex justify-between gap-4 border-t pt-2">
            <dt className="text-foreground font-semibold">Total a pagar hoy</dt>
            <dd className="text-foreground text-lg font-semibold tracking-tight">
              {formatCop(price, currency)}
            </dd>
          </div>
        </dl>
        <p className="text-muted-foreground text-xs leading-relaxed">
          El total incluye la protección TruePhone. No añadimos IVA encima de
          ese porcentaje.
        </p>
      </div>
    );
  }

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
              <dt>{protectionLabel}</dt>
              <dd>{formatCop(protectionFee, currency)}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
