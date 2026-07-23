"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { confirmMockPaymentAction } from "@/features/payments/actions/payments";
import type { PaymentActionState } from "@/features/payments/schemas/payment";
import { formatOrderMoney } from "@/lib/orders";

type MockCheckoutConfirmProps = {
  reference: string;
  amount: number;
  currency: string;
  listingTitle: string;
};

const initial: PaymentActionState = null;

export function MockCheckoutConfirm({
  reference,
  amount,
  currency,
  listingTitle,
}: MockCheckoutConfirmProps) {
  const [state, action, pending] = useActionState(
    confirmMockPaymentAction,
    initial,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="reference" value={reference} />
      <div className="space-y-1">
        <p className="text-foreground text-sm font-semibold">{listingTitle}</p>
        <p className="text-muted-foreground text-sm">
          Simulación de pago · {formatOrderMoney(amount, currency)}
        </p>
      </div>
      {state && !state.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" fullWidth loading={pending}>
        Simular pago aprobado
      </Button>
      <p className="text-muted-foreground text-center text-xs">
        Solo disponible en desarrollo cuando Wompi no está configurado.
      </p>
    </form>
  );
}
