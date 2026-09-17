"use client";

/**
 * @file buyer-checkout-panels.tsx
 * @description Shared checkout state for desktop hero and mobile sticky pay bar.
 * @dependencies react, OrderCheckoutSection
 */

import { useMemo, useState } from "react";

import type { DeliveryAddressFieldValues } from "@/features/orders/components/delivery-address-fields";
import { OrderCheckoutSection } from "@/features/orders/components/order-checkout-section";
import { resolveCityFormState } from "@/lib/locations/colombia-cities";

type BuyerCheckoutPanelsProps = {
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
};

/**
 * BuyerCheckoutPanels
 *
 * Keeps delivery address and legal acceptance in sync between main checkout
 * and the mobile sticky pay bar.
 *
 * @param props - Checkout pricing and delivery prefill props.
 * @returns Desktop checkout section plus mobile sticky bar.
 * @calledBy OrderDetailView
 */
export function BuyerCheckoutPanels(props: BuyerCheckoutPanelsProps) {
  const cityState = resolveCityFormState(props.deliveryPrefill?.cityOption);
  const initialDelivery = useMemo<DeliveryAddressFieldValues>(
    () => ({
      recipientName: props.deliveryPrefill?.recipientName ?? "",
      phone: props.deliveryPrefill?.phone ?? "",
      department: props.deliveryPrefill?.department ?? "",
      cityOption:
        cityState.cityOption || props.deliveryPrefill?.cityOption || "",
      cityDetail:
        cityState.cityDetail || props.deliveryPrefill?.cityDetail || "",
      addressLine: props.deliveryPrefill?.addressLine ?? "",
      notes: props.deliveryPrefill?.notes ?? "",
    }),
    [cityState.cityDetail, cityState.cityOption, props.deliveryPrefill],
  );

  const [deliveryValues, setDeliveryValues] =
    useState<DeliveryAddressFieldValues>(initialDelivery);
  const [legalAccepted, setLegalAccepted] = useState(false);

  return (
    <>
      <OrderCheckoutSection
        {...props}
        deliveryValues={deliveryValues}
        onDeliveryValuesChange={setDeliveryValues}
        legalAccepted={legalAccepted}
        onLegalAcceptedChange={setLegalAccepted}
      />
      <div className="tp-glass border-border fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t px-4 py-3 backdrop-blur-md backdrop-saturate-[1.1] motion-reduce:backdrop-blur-none md:hidden">
        <OrderCheckoutSection
          compact
          {...props}
          deliveryValues={deliveryValues}
          onDeliveryValuesChange={setDeliveryValues}
          legalAccepted={legalAccepted}
          onLegalAcceptedChange={setLegalAccepted}
        />
      </div>
    </>
  );
}
