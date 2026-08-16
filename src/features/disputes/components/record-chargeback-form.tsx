/**
 * @file record-chargeback-form.tsx
 * @description Admin form to ingest a chargeback when the Wompi webhook was missed.
 * @dependencies react, recordChargebackAction
 */

"use client";

import { useActionState } from "react";

import { recordChargebackAction } from "@/features/disputes/actions/ops-disputes";
import type { OpsDisputeActionState } from "@/features/disputes/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * RecordChargebackForm
 *
 * Manual CHARGEBACK_RECEIVED entry by payment id (Wompi txn or TruePhone payment).
 *
 * @returns Admin form for missed provider signals.
 * @calledBy AdminDisputesPage
 */
export function RecordChargebackForm() {
  const [state, action, pending] = useActionState<
    OpsDisputeActionState,
    FormData
  >(recordChargebackAction, null);

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="chargeback-payment-id" className="text-xs">
            ID del pago TruePhone
          </Label>
          <Input
            id="chargeback-payment-id"
            name="paymentId"
            required
            placeholder="uuid del cobro"
            className="h-9 font-mono text-sm"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="chargeback-amount" className="text-xs">
            Monto COP (opcional)
          </Label>
          <Input
            id="chargeback-amount"
            name="amountPesos"
            inputMode="numeric"
            placeholder="Vacío = monto del cobro"
            className="h-9"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="chargeback-ref" className="text-xs">
            Referencia Wompi (opcional)
          </Label>
          <Input
            id="chargeback-ref"
            name="providerReference"
            placeholder="ID de transacción en Wompi"
            className="h-9 font-mono text-sm"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="chargeback-memo" className="text-xs">
            Notas
          </Label>
          <Textarea
            id="chargeback-memo"
            name="memo"
            rows={2}
            placeholder="Ej. aviso del banco / dashboard Wompi"
            className="min-h-16 text-sm"
          />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Registrando…" : "Registrar contracargo"}
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
