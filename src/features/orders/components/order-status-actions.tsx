"use client";

/**
 * @file order-status-actions.tsx
 * @description Cancel / support CTAs on order detail. Paid sellers contact support
 *   instead of self-cancelling; unpaid parties and paid buyers keep cancel.
 * @dependencies react, next/link, next/navigation, @/components/ui/button,
 *   @/components/ui/textarea, @/features/orders/actions/orders
 * @changelog 2026-08-24 — Paid sellers see Contactar soporte + reputation warning.
 */

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
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

const SUPPORT_EMAIL = "hola@truephone.co";

/**
 * buildSellerSupportMailto
 *
 * Builds a mailto URL so paid sellers can ask ops to cancel a paid order.
 *
 * @param orderId - Order UUID included in subject and body for support triage.
 * @returns Encoded mailto href for Contactar soporte.
 * @calledBy OrderStatusActions
 */
function buildSellerSupportMailto(orderId: string): string {
  const subject = `Cancelación de pedido pagado — ${orderId}`;
  const body = [
    "Hola TruePhone,",
    "",
    `Necesito cancelar el pedido pagado: ${orderId}`,
    "",
    "Motivo:",
    "(explica brevemente por qué no puedes completar la venta)",
    "",
  ].join("\n");

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * OrderStatusActions
 *
 * Renders cancel confirmation for unpaid orders and paid buyers, or support
 * contact for paid sellers (self-cancel is blocked after payment).
 *
 * @param props.orderId - Order to cancel or reference in support mail.
 * @param props.canCancel - Whether self-cancel is allowed for this actor/status.
 * @param props.isPaid - Order is in PAID status (custody active).
 * @param props.isSeller - Current user is the seller on this order.
 * @returns Action panel, or null when neither cancel nor paid-seller support applies.
 * @calledBy OrderDetailView
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

  const showPaidSellerSupport = isSeller && isPaid;

  useEffect(() => {
    if (cancelState?.ok) {
      router.refresh();
    }
  }, [cancelState, router]);

  if (!canCancel && !showPaidSellerSupport) return null;

  // Paid sellers cannot self-cancel — route them to support with a reputation note.
  if (showPaidSellerSupport) {
    return (
      <div className="border-border space-y-3 rounded-xl border p-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Usa la sección Envío para elegir transportadora o Premium Bogotá.
          TruePhone libera tu pago tras la recepción del comprador y su
          confirmación (o 24h).
        </p>
        <p className="text-foreground text-sm leading-relaxed" role="note">
          Cancelar después del pago queda registrado en tu perfil y puede
          afectar la confianza de compradores y tus futuras ventas. Si no puedes
          completar esta venta, escribe a soporte para que un agente la
          gestione.
        </p>
        <div className="space-y-2">
          <Button asChild fullWidth>
            <a href={buildSellerSupportMailto(orderId)}>Contactar soporte</a>
          </Button>
          <Button asChild variant="outline" fullWidth>
            <Link href="/ayuda#pagos">Ver ayuda sobre pagos</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isPaid && !isSeller ? (
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
            {isPaid && !isSeller ? (
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
