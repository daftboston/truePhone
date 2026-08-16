/**
 * @file mark-manual-payout-button.tsx
 * @description Admin control to confirm a seller was paid in Wompi.
 * @dependencies react, markManualPayoutCompletedAction
 */

"use client";

import { useActionState } from "react";

import {
  markManualPayoutCompletedAction,
  type ManualPayoutActionState,
} from "@/features/payouts/actions/manual-payout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MarkManualPayoutButtonProps = {
  payoutId: string;
};

/**
 * MarkManualPayoutButton
 *
 * Form: optional Wompi reference + confirm after paying in Wompi dashboard.
 *
 * @param props.payoutId - AUTHORIZED payout id.
 * @returns Compact confirm form.
 * @calledBy AdminPaymentsPage
 */
export function MarkManualPayoutButton({
  payoutId,
}: MarkManualPayoutButtonProps) {
  const [state, formAction, pending] = useActionState<
    ManualPayoutActionState,
    FormData
  >(markManualPayoutCompletedAction, null);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="payoutId" value={payoutId} />
      <div className="space-y-1">
        <Label htmlFor={`ref-${payoutId}`} className="text-xs">
          Referencia Wompi (opcional)
        </Label>
        <Input
          id={`ref-${payoutId}`}
          name="providerReference"
          placeholder="Id de transferencia / lote"
          className="h-9"
          autoComplete="off"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Confirmando…" : "Ya pagué en Wompi"}
      </Button>
      {state?.ok === false ? (
        <p className="text-destructive text-xs" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p className="text-foreground text-xs" role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
