"use client";

import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { Button } from "@/components/ui/button";
import { startCheckoutAction } from "@/features/payments/actions/payments";
import { formatOrderMoney } from "@/lib/format-money";

type PayOrderButtonProps = {
  orderId: string;
  totalPrice: number;
  platformFee: number;
  currency?: string;
};

export function PayOrderButton({
  orderId,
  totalPrice,
  platformFee,
  currency = "COP",
}: PayOrderButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
        {formatOrderMoney(platformFee, currency)} de protección TruePhone 6%).
        El vendedor recibe el precio del equipo.
      </p>
    </div>
  );
}
