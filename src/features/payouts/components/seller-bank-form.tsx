/**
 * @file seller-bank-form.tsx
 * @description Client form for seller default bank payout destination.
 * @dependencies react, upsertSellerBankAccountAction, design-system inputs
 */

"use client";

import { useActionState } from "react";

import { upsertSellerBankAccountAction } from "@/features/payouts/actions/bank-account";
import type { PayoutActionState } from "@/features/payouts/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { COLOMBIA_BANKS } from "@/lib/payments/colombia-banks";

export type SellerBankFormValues = {
  legalIdType: string;
  legalId: string;
  bankCode: string;
  accountType: string;
  accountNumber: string;
  holderName: string;
  email: string;
};

type SellerBankFormProps = {
  initial?: Partial<SellerBankFormValues> | null;
};

/**
 * SellerBankForm
 *
 * Collects Colombian bank account fields for Compra Garantizada settlement.
 *
 * @param props.initial - Prefill from existing default account.
 * @returns Bank account form.
 * @calledBy /pagos page
 */
export function SellerBankForm({ initial }: SellerBankFormProps) {
  const [state, formAction, pending] = useActionState<
    PayoutActionState,
    FormData
  >(upsertSellerBankAccountAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="legalIdType">Tipo de documento</Label>
          <Select
            id="legalIdType"
            name="legalIdType"
            defaultValue={initial?.legalIdType ?? "CC"}
            required
          >
            <option value="CC">Cédula de ciudadanía</option>
            <option value="CE">Cédula de extranjería</option>
            <option value="NIT">NIT</option>
          </Select>
          {state?.ok === false && state.fieldErrors?.legalIdType ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.legalIdType[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="legalId">Número de documento</Label>
          <Input
            id="legalId"
            name="legalId"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={initial?.legalId ?? ""}
            required
          />
          {state?.ok === false && state.fieldErrors?.legalId ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.legalId[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bankCode">Banco</Label>
        <Select
          id="bankCode"
          name="bankCode"
          defaultValue={initial?.bankCode ?? ""}
          required
        >
          <option value="" disabled>
            Selecciona un banco
          </option>
          {COLOMBIA_BANKS.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </Select>
        {state?.ok === false && state.fieldErrors?.bankCode ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.bankCode[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="accountType">Tipo de cuenta</Label>
          <Select
            id="accountType"
            name="accountType"
            defaultValue={initial?.accountType ?? "AHORROS"}
            required
          >
            <option value="AHORROS">Ahorros</option>
            <option value="CORRIENTE">Corriente</option>
          </Select>
          {state?.ok === false && state.fieldErrors?.accountType ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.accountType[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountNumber">Número de cuenta</Label>
          <Input
            id="accountNumber"
            name="accountNumber"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={initial?.accountNumber ?? ""}
            required
          />
          {state?.ok === false && state.fieldErrors?.accountNumber ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.accountNumber[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="holderName">Nombre del titular</Label>
        <Input
          id="holderName"
          name="holderName"
          autoComplete="name"
          defaultValue={initial?.holderName ?? ""}
          required
        />
        {state?.ok === false && state.fieldErrors?.holderName ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.holderName[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo para la transferencia</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={initial?.email ?? ""}
          required
        />
        {state?.ok === false && state.fieldErrors?.email ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      {state?.ok === false && state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true && state.message ? (
        <p className="text-foreground text-sm" role="status">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cuenta bancaria"}
      </Button>
    </form>
  );
}
