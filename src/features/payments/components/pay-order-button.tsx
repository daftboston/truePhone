"use client";

/**
 * @file pay-order-button.tsx
 * @description Client button that starts Guaranteed Purchase checkout.
 * @dependencies react, startCheckoutAction, formatOrderMoney, Button
 * @changelog 2026-09-17 — Sends delivery address with checkout start.
 */

import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { Button } from "@/components/ui/button";
import type { DeliveryAddressFieldValues } from "@/features/orders/components/delivery-address-fields";
import { startCheckoutAction } from "@/features/payments/actions/payments";
import { formatOrderMoney } from "@/lib/format-money";

type PayOrderButtonProps = {
  orderId: string;
  totalPrice: number;
  platformFee: number;
  feePercent?: number;
  currency?: string;
  /** Must be true before checkout can start (Ley 527). */
  legalAccepted: boolean;
  deliveryAddress: DeliveryAddressFieldValues;
  /** `fee` shows total + protection amount; `none` is the button only. */
  disclosure?: "fee" | "none";
};

/**
 * PayOrderButton
 *
 * Invokes startCheckoutAction after legal acceptance and optionally shows fee microcopy.
 *
 * @param props.orderId - Order to pay.
 * @param props.totalPrice - Buyer total including platform fee.
 * @param props.platformFee - TruePhone protection fee amount.
 * @param props.feePercent - Fee percent shown in helper copy (default 10).
 * @param props.currency - Currency code for money formatting (default COP).
 * @param props.legalAccepted - Checkbox state from parent; blocks pay when false.
 * @param props.deliveryAddress - Delivery fields captured in checkout.
 * @param props.disclosure - Helper copy under the button.
 * @returns Pay button with error alert and optional fee explanation.
 * @calledBy OrderCheckoutSection, OrderDetailView
 */
export function PayOrderButton({
  orderId,
  totalPrice,
  platformFee,
  feePercent = 10,
  currency = "COP",
  legalAccepted,
  deliveryAddress,
  disclosure = "fee",
}: PayOrderButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  /**
   * onPay
   *
   * Starts checkout in a transition; rethrows Next.js redirect errors.
   */
  function onPay() {
    if (!legalAccepted) {
      setError("Debes aceptar los Términos y la Política de Privacidad.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await startCheckoutAction({
          orderId,
          legalAccepted: true,
          recipientName: deliveryAddress.recipientName,
          phone: deliveryAddress.phone,
          department: deliveryAddress.department,
          cityOption: deliveryAddress.cityOption,
          cityDetail: deliveryAddress.cityDetail,
          addressLine: deliveryAddress.addressLine,
          notes: deliveryAddress.notes,
        });
        if (result && !result.ok) {
          setError(result.error);
        }
      } catch (err) {
        if (isRedirectError(err)) throw err;
        setError("No se pudo iniciar el pago. Intenta de nuevo.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        fullWidth
        loading={pending}
        disabled={!legalAccepted}
        onClick={onPay}
      >
        Pagar Compra Garantizada
      </Button>
      {error ? (
        <p className="text-destructive text-center text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {disclosure === "fee" ? (
        <p className="text-muted-foreground text-center text-xs">
          Pagarás {formatOrderMoney(totalPrice, currency)}, incluyendo{" "}
          {formatOrderMoney(platformFee, currency)} de protección TruePhone (
          {feePercent}%).
        </p>
      ) : null}
    </div>
  );
}
