"use client";

/**
 * @file order-checkout-section.tsx
 * @description Buyer checkout panel with fee breakdown, legal acceptance, and pay CTA.
 * @dependencies react, PriceDisplay, LegalAcceptanceField, PayOrderButton, MarketplaceRoleNotice
 */

import { useState } from "react";

import { LegalAcceptanceField } from "@/components/legal-acceptance-field";
import { MarketplaceRoleNotice } from "@/components/marketplace-role-notice";
import { PriceDisplay } from "@/components/price-display";
import { RetractoNotice } from "@/components/retracto-notice";
import { PayOrderButton } from "@/features/payments/components/pay-order-button";

type OrderCheckoutSectionProps = {
  orderId: string;
  listingTitle: string;
  coverUrl: string | null;
  totalPrice: number;
  equipmentPrice: number;
  platformFee: number;
  feePercent: number;
  protectionLabel?: string;
  currency: string;
  /** When true, renders compact sticky mobile layout (checkbox + pay only). */
  compact?: boolean;
};

/**
 * OrderCheckoutSection
 *
 * Checkout hero with structured fee breakdown, role notice, Ley 527 checkbox,
 * and pay button for AWAITING_PAYMENT orders.
 *
 * @param props - Order pricing and listing display fields.
 * @returns Checkout section for buyer order detail.
 * @calledBy OrderDetailView
 */
export function OrderCheckoutSection({
  orderId,
  listingTitle,
  coverUrl,
  totalPrice,
  equipmentPrice,
  platformFee,
  feePercent,
  protectionLabel,
  currency,
  compact = false,
}: OrderCheckoutSectionProps) {
  const [legalAccepted, setLegalAccepted] = useState(false);

  if (compact) {
    return (
      <div className="space-y-2">
        <LegalAcceptanceField
          checked={legalAccepted}
          onCheckedChange={setLegalAccepted}
          id={`legalAccepted-${orderId}-sticky`}
        />
        <PayOrderButton
          orderId={orderId}
          totalPrice={totalPrice}
          platformFee={platformFee}
          feePercent={feePercent}
          currency={currency}
          legalAccepted={legalAccepted}
          disclosure="none"
        />
      </div>
    );
  }

  return (
    <section className="border-border space-y-4 rounded-xl border p-4">
      <div className="flex gap-3">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="size-20 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="bg-muted size-20 shrink-0 rounded-lg" />
        )}
        <div className="min-w-0">
          <h2 className="text-foreground text-sm font-semibold">
            {listingTitle}
          </h2>
          <p className="text-muted-foreground text-xs">Compra Garantizada</p>
        </div>
      </div>
      <PriceDisplay
        price={totalPrice}
        equipmentPrice={equipmentPrice}
        protectionFee={platformFee}
        feePercent={feePercent}
        protectionLabel={protectionLabel}
        variant="checkout"
        currency={currency}
      />
      <MarketplaceRoleNotice />
      <RetractoNotice />
      <LegalAcceptanceField
        checked={legalAccepted}
        onCheckedChange={setLegalAccepted}
        id={`legalAccepted-${orderId}`}
      />
      <PayOrderButton
        orderId={orderId}
        totalPrice={totalPrice}
        platformFee={platformFee}
        feePercent={feePercent}
        currency={currency}
        legalAccepted={legalAccepted}
        disclosure="none"
      />
    </section>
  );
}
