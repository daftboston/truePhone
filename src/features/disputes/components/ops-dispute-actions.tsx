/**
 * @file ops-dispute-actions.tsx
 * @description Admin controls to refund, unfreeze, or absorb chargebacks per order.
 * @dependencies react, ops dispute actions
 */

"use client";

import { useActionState } from "react";

import {
  authorizeOpsRefundAction,
  markChargebackAbsorbedAction,
  resolveDisputeForSellerAction,
} from "@/features/disputes/actions/ops-disputes";
import type { OpsDisputeActionState } from "@/features/disputes/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type OpsDisputeActionsProps = {
  orderId: string;
  paymentId: string | null;
  kind:
    | "chargeback"
    | "premium_fail"
    | "buyer_report"
    | "frozen"
    | "absorbed_pending";
  defaultRefundReason:
    | "PREMIUM_INSPECTION_FAILED"
    | "DISPUTE_BUYER_WIN"
    | "BATTERY_RETURN"
    | "CHARGEBACK_RECONCILE"
    | "MANUAL";
};

/**
 * ActionStatus
 *
 * Renders success / error feedback from a server action.
 */
function ActionStatus({ state }: { state: OpsDisputeActionState }) {
  if (!state) return null;
  if (state.ok === false) {
    return (
      <p className="text-destructive text-xs" role="alert">
        {state.error}
      </p>
    );
  }
  return (
    <p className="text-foreground text-xs" role="status">
      {state.message}
    </p>
  );
}

/**
 * OpsDisputeActions
 *
 * Per-case ops forms: refund buyer, seller win, or absorb post-payout chargeback.
 *
 * @param props.orderId - Order under review.
 * @param props.paymentId - Latest payment id when present.
 * @param props.kind - Classification from classifyOpsDisputeCase.
 * @param props.defaultRefundReason - Prefills refund reason select.
 * @returns Action forms for the disputes queue card.
 * @calledBy AdminDisputesPage
 */
export function OpsDisputeActions({
  orderId,
  paymentId,
  kind,
  defaultRefundReason,
}: OpsDisputeActionsProps) {
  const [refundState, refundAction, refundPending] = useActionState<
    OpsDisputeActionState,
    FormData
  >(authorizeOpsRefundAction, null);

  const [sellerState, sellerAction, sellerPending] = useActionState<
    OpsDisputeActionState,
    FormData
  >(resolveDisputeForSellerAction, null);

  const [absorbState, absorbAction, absorbPending] = useActionState<
    OpsDisputeActionState,
    FormData
  >(markChargebackAbsorbedAction, null);

  if (kind === "absorbed_pending") {
    return (
      <form action={absorbAction} className="space-y-2">
        <input type="hidden" name="orderId" value={orderId} />
        <div className="space-y-1">
          <Label htmlFor={`absorb-notes-${orderId}`} className="text-xs">
            Notas (opcional)
          </Label>
          <Input
            id={`absorb-notes-${orderId}`}
            name="notes"
            placeholder="Pérdida absorbida en Cuenta Wompi"
            className="h-9"
            autoComplete="off"
          />
        </div>
        <Button type="submit" size="sm" disabled={absorbPending}>
          {absorbPending ? "Guardando…" : "Marcar contracargo absorbido"}
        </Button>
        <ActionStatus state={absorbState} />
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <form action={refundAction} className="space-y-2">
        <input type="hidden" name="orderId" value={orderId} />
        {paymentId ? (
          <input type="hidden" name="paymentId" value={paymentId} />
        ) : null}
        <div className="space-y-1">
          <Label htmlFor={`reason-${orderId}`} className="text-xs">
            Motivo del reembolso
          </Label>
          <select
            id={`reason-${orderId}`}
            name="reason"
            defaultValue={defaultRefundReason}
            className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
          >
            <option value="PREMIUM_INSPECTION_FAILED">
              Inspección Premium fallida
            </option>
            <option value="DISPUTE_BUYER_WIN">Reclamo · gana comprador</option>
            <option value="BATTERY_RETURN">Batería · devolución</option>
            <option value="CHARGEBACK_RECONCILE">Conciliar contracargo</option>
            <option value="MANUAL">Manual / otro</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`listing-${orderId}`} className="text-xs">
            Anuncio tras el reembolso
          </Label>
          <select
            id={`listing-${orderId}`}
            name="listingOutcome"
            defaultValue={
              defaultRefundReason === "PREMIUM_INSPECTION_FAILED"
                ? "archive"
                : "republish"
            }
            className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
          >
            <option value="republish">Volver a publicar</option>
            <option value="archive">Archivar</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`refund-notes-${orderId}`} className="text-xs">
            Notas
          </Label>
          <Textarea
            id={`refund-notes-${orderId}`}
            name="notes"
            rows={2}
            placeholder="Detalle para el ledger"
            className="min-h-16 text-sm"
          />
        </div>
        <Button type="submit" size="sm" disabled={refundPending}>
          {refundPending ? "Procesando…" : "Reembolsar al comprador"}
        </Button>
        <ActionStatus state={refundState} />
      </form>

      {kind !== "chargeback" && kind !== "premium_fail" ? (
        <form
          action={sellerAction}
          className="border-border space-y-2 border-t pt-3"
        >
          <input type="hidden" name="orderId" value={orderId} />
          <div className="space-y-1">
            <Label htmlFor={`seller-memo-${orderId}`} className="text-xs">
              Resolución a favor del vendedor
            </Label>
            <Input
              id={`seller-memo-${orderId}`}
              name="memo"
              placeholder="Equipo correcto · reclamo improcedente"
              className="h-9"
              autoComplete="off"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={sellerPending}
          >
            {sellerPending ? "Guardando…" : "Descongelar (gana vendedor)"}
          </Button>
          <ActionStatus state={sellerState} />
        </form>
      ) : null}
    </div>
  );
}
