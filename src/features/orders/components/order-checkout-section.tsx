"use client";

/**
 * @file order-checkout-section.tsx
 * @description Buyer checkout panel with delivery address, fee breakdown, legal acceptance, and pay CTA.
 * @dependencies react, PriceDisplay, LegalAcceptanceField, PayOrderButton, DeliveryAddressFields
 */

import { LegalAcceptanceField } from "@/components/legal-acceptance-field";
import { MarketplaceRoleNotice } from "@/components/marketplace-role-notice";
import { PriceDisplay } from "@/components/price-display";
import { RetractoNotice } from "@/components/retracto-notice";
import {
  DeliveryAddressFields,
  type DeliveryAddressFieldValues,
} from "@/features/orders/components/delivery-address-fields";
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
  deliveryPrefill?: Partial<DeliveryAddressFieldValues>;
  deliveryValues: DeliveryAddressFieldValues;
  onDeliveryValuesChange: (values: DeliveryAddressFieldValues) => void;
  legalAccepted: boolean;
  onLegalAcceptedChange: (accepted: boolean) => void;
  /** When true, renders compact sticky mobile layout (checkbox + pay only). */
  compact?: boolean;
};

/**
 * OrderCheckoutSection
 *
 * Checkout hero with delivery address, structured fee breakdown, role notice,
 * Ley 527 checkbox, and pay button for AWAITING_PAYMENT orders.
 *
 * @param props - Order pricing, listing display, and delivery prefill fields.
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
  deliveryPrefill,
  deliveryValues,
  onDeliveryValuesChange,
  legalAccepted,
  onLegalAcceptedChange,
  compact = false,
}: OrderCheckoutSectionProps) {
  if (compact) {
    return (
      <div className="space-y-3">
        <LegalAcceptanceField
          checked={legalAccepted}
          onCheckedChange={onLegalAcceptedChange}
          id={`legalAccepted-${orderId}-sticky`}
        />
        <PayOrderButton
          orderId={orderId}
          totalPrice={totalPrice}
          platformFee={platformFee}
          feePercent={feePercent}
          currency={currency}
          legalAccepted={legalAccepted}
          deliveryAddress={deliveryValues}
          disclosure="none"
        />
      </div>
    );
  }

  return (
    <section className="border-border space-y-6 rounded-xl border p-4">
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
      <div className="border-border space-y-4 border-t pt-4">
        <div className="space-y-1">
          <h3 className="text-foreground text-sm font-semibold">
            Dirección de entrega
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Completa la dirección antes de pagar. Al confirmarse el pago, queda
            fijada.
          </p>
        </div>
        <DeliveryAddressFields
          idPrefix={`checkout-${orderId}`}
          initialValues={deliveryPrefill}
          onValuesChange={onDeliveryValuesChange}
        />
      </div>
      <MarketplaceRoleNotice />
      <RetractoNotice />
      <LegalAcceptanceField
        checked={legalAccepted}
        onCheckedChange={onLegalAcceptedChange}
        id={`legalAccepted-${orderId}`}
      />
      <PayOrderButton
        orderId={orderId}
        totalPrice={totalPrice}
        platformFee={platformFee}
        feePercent={feePercent}
        currency={currency}
        legalAccepted={legalAccepted}
        deliveryAddress={deliveryValues}
        disclosure="none"
      />
    </section>
  );
}
