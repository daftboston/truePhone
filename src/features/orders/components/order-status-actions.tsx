"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelOrderAction,
  completeOrderAction,
} from "@/features/orders/actions/orders";
import type { OrderActionState } from "@/features/orders/schemas/order";

type OrderStatusActionsProps = {
  orderId: string;
  canCancel: boolean;
  canComplete: boolean;
  isPaid?: boolean;
};

const initial: OrderActionState = null;

export function OrderStatusActions({
  orderId,
  canCancel,
  canComplete,
  isPaid = false,
}: OrderStatusActionsProps) {
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelOrderAction,
    initial,
  );
  const [completeState, completeAction, completePending] = useActionState(
    completeOrderAction,
    initial,
  );

  useEffect(() => {
    if (cancelState?.ok || completeState?.ok) {
      router.refresh();
    }
  }, [cancelState, completeState, router]);

  if (!canCancel && !canComplete) return null;

  return (
    <div className="space-y-3">
      {canComplete ? (
        <form action={completeAction} className="space-y-2">
          <input type="hidden" name="orderId" value={orderId} />
          <Button type="submit" fullWidth loading={completePending}>
            Marcar venta como completada
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            Confirma solo cuando el comprador tenga el dispositivo. El pago de
            Compra Garantizada ya está confirmado.
          </p>
          {completeState && !completeState.ok ? (
            <p className="text-destructive text-sm" role="alert">
              {completeState.error}
            </p>
          ) : null}
          {completeState?.ok ? (
            <p className="text-muted-foreground text-sm" role="status">
              {completeState.message}
            </p>
          ) : null}
        </form>
      ) : null}

      {canCancel ? (
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
              {isPaid ? (
                <p className="text-muted-foreground text-xs">
                  Este pedido ya tiene pago confirmado. Al cancelar se inicia el
                  reembolso de Compra Garantizada.
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
      ) : null}
    </div>
  );
}
