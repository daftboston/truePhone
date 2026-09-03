"use client";

/**
 * @file order-status-actions.tsx
 * @description Self-cancel confirmation for unpaid orders and eligible paid buyers.
 * @dependencies react, next/navigation, @/components/ui/button,
 *   @/components/ui/textarea, @/features/orders/actions/orders
 * @changelog 2026-08-26 — Paid seller assistance moved to OrderSupportPanel.
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
};

const initial: OrderActionState = null;

/**
 * OrderStatusActions
 *
 * Renders cancel confirmation for unpaid orders and eligible paid buyers.
 *
 * @param props.orderId - Order to cancel.
 * @param props.canCancel - Whether self-cancel is allowed for this actor/status.
 * @param props.isPaid - Order is in PAID status (custody active).
 * @returns Cancel action panel or null.
 * @calledBy OrderDetailView
 */
export function OrderStatusActions({
  orderId,
  canCancel,
  isPaid = false,
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
      {isPaid ? (
        <p className="text-muted-foreground text-xs">
          Fondos en custodia de TruePhone. El vendedor recibe el pago solo
          después de que marques recepción y confirmes que está correcto (o 24
          horas sin reporte).
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
            {isPaid ? (
              <p className="text-muted-foreground text-xs">
                Al cancelar, el reembolso descuenta la comisión de procesamiento
                de Wompi (ya cobrada).
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
