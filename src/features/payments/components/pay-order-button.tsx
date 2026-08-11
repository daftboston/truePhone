"use client";

/**
 * @file pay-order-button.tsx
 * @description Client button that starts Guaranteed Purchase checkout and shows
 * fee + 24h settlement disclosure (FINANCIAL_MODEL §5.1).
 * @dependencies react, startCheckoutAction, formatOrderMoney, Button
 */

import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { Button } from "@/components/ui/button";
import { startCheckoutAction } from "@/features/payments/actions/payments";
import { formatOrderMoney } from "@/lib/format-money";

type PayOrderButtonProps = {
  orderId: string;
  totalPrice: number;
  platformFee: number;
  feePercent?: number;
  currency?: string;
};

/**
 * PayOrderButton
 *
 * Invokes startCheckoutAction and shows fee breakdown copy under the CTA.
 *
 * @param props.orderId - Order to pay.
 * @param props.totalPrice - Buyer total including platform fee.
 * @param props.platformFee - TruePhone protection fee amount.
 * @param props.feePercent - Fee percent shown in helper copy (default 10).
 * @param props.currency - Currency code for money formatting (default COP).
 * @returns Pay button with error alert and fee explanation.
 * @calledBy OrderDetailView, order buyer pages
 */
export function PayOrderButton({
  orderId,
  totalPrice,
  platformFee,
  feePercent = 10,
  currency = "COP",
}: PayOrderButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  /**
   * onPay
   *
   * Starts checkout in a transition; rethrows Next.js redirect errors.
   */
  function onPay() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await startCheckoutAction(orderId);
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
      <Button type="button" fullWidth loading={pending} onClick={onPay}>
        Pagar Compra Garantizada
      </Button>
      {error ? (
        <p className="text-destructive text-center text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-muted-foreground text-center text-xs">
        Pagarás {formatOrderMoney(totalPrice, currency)} (incluye{" "}
        {formatOrderMoney(platformFee, currency)} de protección TruePhone{" "}
        {feePercent}%). TruePhone retiene el pago hasta que confirmes que el
        iPhone está correcto, o hasta 24 horas después de marcar «Ya recibí». Si
        no reportas un problema en ese lapso, TruePhone paga al vendedor.
      </p>
    </div>
  );
}
