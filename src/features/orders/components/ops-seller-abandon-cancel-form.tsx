/**
 * @file ops-seller-abandon-cancel-form.tsx
 * @description Ops form to cancel a PAID order as seller abandon (8% entitlement path).
 * @dependencies react, next/navigation, @/components/ui/*, @/features/orders/actions/orders
 */

"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { opsCancelPaidOrderAsSellerAbandonAction } from "@/features/orders/actions/orders";
import type { OrderActionState } from "@/features/orders/schemas/order";

type OpsSellerAbandonCancelFormProps = {
  orderId: string;
  listingTitle: string;
  disabled?: boolean;
  disabledReason?: string | null;
};

const initial: OrderActionState = null;

/**
 * OpsSellerAbandonCancelForm
 *
 * Confirms seller-abandon cancel for a PAID order. Requires a short reason.
 *
 * @param props.orderId - Order UUID (from support mailto or queue).
 * @param props.listingTitle - Shown in the confirm copy.
 * @param props.disabled - When the order is not eligible.
 * @param props.disabledReason - Spanish explanation when disabled.
 * @returns Form card for the ops cancelaciones page.
 * @calledBy `/revision/cancelaciones`
 */
export function OpsSellerAbandonCancelForm({
  orderId,
  listingTitle,
  disabled = false,
  disabledReason = null,
}: OpsSellerAbandonCancelFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    opsCancelPaidOrderAsSellerAbandonAction,
    initial,
  );

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  if (disabled) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        {disabledReason ?? "Este pedido ya no se puede cancelar como abandono."}
      </p>
    );
  }

  return (
    <form
      action={action}
      className="border-border space-y-3 rounded-xl border p-3"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-muted-foreground text-xs leading-relaxed">
        Cancela «{listingTitle}» como abandono del vendedor: el comprador elige
        reembolso o 8% de reemplazo; el anuncio vuelve a revisión (no se publica
        solo). No reembolsa automáticamente.
      </p>
      <label
        htmlFor={`ops-abandon-reason-${orderId}`}
        className="text-foreground text-sm font-medium"
      >
        Motivo (obligatorio)
      </label>
      <Textarea
        id={`ops-abandon-reason-${orderId}`}
        name="reason"
        placeholder="Ej. vendedor pidió cancelar por WhatsApp; no puede enviar"
        maxLength={500}
        className="min-h-20"
        required
        disabled={pending}
      />
      {state && !state.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {state.fieldErrors?.reason?.[0] ?? state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-foreground text-sm" role="status">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" variant="outline" size="sm" loading={pending}>
        Cancelar como abandono del vendedor
      </Button>
    </form>
  );
}
