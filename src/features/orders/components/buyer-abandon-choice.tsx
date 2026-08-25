"use client";

/**
 * @file buyer-abandon-choice.tsx
 * @description Buyer UI to pick full refund vs one-time 8% replacement after seller cancel.
 * @dependencies react, next/navigation, Button, chooseRefundAfterSellerAbandonAction
 */

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { chooseRefundAfterSellerAbandonAction } from "@/features/orders/actions/orders";
import type { OrderActionState } from "@/features/orders/schemas/order";

type BuyerAbandonChoiceProps = {
  orderId: string;
};

const initial: OrderActionState = null;

/**
 * BuyerAbandonChoice
 *
 * Explains the FINANCIAL_MODEL §5.2 choice: keep shopping at 8% or request refund.
 *
 * @param props.orderId - Cancelled source order UUID.
 * @returns Choice card for the buyer.
 * @calledBy OrderDetailView
 */
export function BuyerAbandonChoice({ orderId }: BuyerAbandonChoiceProps) {
  const router = useRouter();
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [state, action, pending] = useActionState(
    chooseRefundAfterSellerAbandonAction,
    initial,
  );

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <section className="border-border space-y-3 rounded-xl border p-4">
      <h2 className="text-foreground text-sm font-semibold">
        Lamentamos que el vendedor haya cancelado
      </h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Tu dinero sigue en custodia de TruePhone. Puedes pedir reembolso, o
        buscar otro iPhone con{" "}
        <span className="text-foreground font-medium">8% de protección</span>{" "}
        (en lugar del 10% habitual), una sola vez.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/explorar">Buscar otro iPhone al 8%</Link>
        </Button>
        {!confirmRefund ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmRefund(true)}
          >
            Pedir reembolso
          </Button>
        ) : (
          <form action={action} className="flex flex-1 flex-col gap-2">
            <input type="hidden" name="orderId" value={orderId} />
            <p className="text-muted-foreground text-xs leading-relaxed">
              Al confirmar, autorizas el reembolso de este pedido. La oferta del
              8% desaparece: no podrás usarla en una compra de reemplazo.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? "Procesando…" : "Confirmar reembolso"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => setConfirmRefund(false)}
              >
                Volver
              </Button>
            </div>
          </form>
        )}
      </div>
      {state && !state.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-foreground text-sm" role="status">
          {state.message ?? "Reembolso autorizado."}
        </p>
      ) : null}
    </section>
  );
}
