"use client";

/**
 * @file order-status-actions.tsx
 * @description OrderStatusActions component for the orders feature.tsx.
 * @dependencies react, next/navigation, @/components/ui/button, @/components/ui/textarea, @/features/orders/actions/orders
 */

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cancelOrderAction } from "@/features/orders/actions/orders";
import type { OrderActionState } from "@/features/orders/schemas/order";

type OrderStatusActionsProps = {
  orderId: string;
  canCancel: boolean;
  isPaid?: boolean;
  isSeller?: boolean;
};

const initial: OrderActionState = null;

/**
 * OrderStatusActions
 *
 * Renders the Order Status Actions UI for orders.
 *
 * @param props - OrderStatusActions props.
 * @returns OrderStatusActions React element.
 * @calledBy orders pages and parent components
 */
export function OrderStatusActions({
  orderId,
  canCancel,
  isPaid = false,
  isSeller = false,
}: OrderStatusActionsProps) {
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelOrderAction,
    initial,
  );

  useEffect(() => {
    if (cancelState?.ok) {
      router.refresh();
    }
  }, [cancelState, router]);

  if (!canCancel) return null;

  return (
    <div className="space-y-3">
      {isPaid && !isSeller ? (
        <p className="text-muted-foreground text-xs">
          Fondos en custodia de TruePhone. El vendedor recibe el pago solo
          después de que marques recepción y confirmes que está correcto (o 24
          horas sin reporte).
        </p>
      ) : null}
      {isPaid && isSeller ? (
        <p className="text-muted-foreground text-xs">
          Usa la sección Envío para elegir transportadora o Premium Bogotá.
          TruePhone libera tu pago tras la recepción del comprador y su
          confirmación (o 24h).
        </p>
      ) : null}

      <div className="space-y-2">
        {!showCancel ? (
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => setShowCancel(true)}
          >
            Cancelar pedido
          </Button>
        ) : (
          <form
            action={cancelAction}
            className="border-border space-y-2 rounded-xl border p-3"
          >
            <input type="hidden" name="orderId" value={orderId} />
            {isPaid && !isSeller ? (
              <p className="text-muted-foreground text-xs">
                Al cancelar, el reembolso descuenta la comisión de procesamiento
                de Wompi (ya cobrada).
              </p>
            ) : null}
            {isPaid && isSeller ? (
              <p className="text-muted-foreground text-xs">
                Si cancelas después del pago, el comprador podrá elegir
                reembolso o una compra de reemplazo con 8% de comisión (una sola
                vez). No se reembolsa automáticamente.
              </p>
            ) : null}
            <label
              htmlFor="cancel-reason"
              className="text-foreground text-sm font-medium"
            >
              Motivo (opcional)
            </label>
            <Textarea
              id="cancel-reason"
              name="reason"
              placeholder="¿Por qué cancelas?"
              maxLength={500}
              className="min-h-20"
              disabled={cancelPending}
            />
            {cancelState && !cancelState.ok ? (
              <p className="text-destructive text-sm" role="alert">
                {cancelState.fieldErrors?.reason?.[0] ?? cancelState.error}
              </p>
            ) : null}
            {cancelState?.ok ? (
              <p className="text-muted-foreground text-sm" role="status">
                {cancelState.message}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCancel(false)}
              >
                Volver
              </Button>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                loading={cancelPending}
              >
                Confirmar cancelación
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
