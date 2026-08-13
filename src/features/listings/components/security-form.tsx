"use client";

/**
 * @file security-form.tsx
 * @description SecurityForm component for the listings feature.tsx.
 * @dependencies react, @/features/listings/actions/listings, @/features/listings/schemas/listing, @/features/listings/types, @/components/ui/button, @/components/ui/input
 */

import { useActionState, useState } from "react";

import { updateListingSecurityAction } from "@/features/listings/actions/listings";
import {
  COLOMBIAN_OPERATORS,
  matchColombianOperator,
} from "@/features/listings/schemas/listing";
import type { ListingActionState } from "@/features/listings/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type SecurityFormProps = {
  listingId: string;
  defaults?: {
    imeiLast4: string | null;
    unlocked: boolean;
    carrier: string | null;
  };
};

/**
 * SecurityForm
 *
 * Collects IMEI, Activation Lock, unlock status, and Colombian operator
 * when the device is carrier-locked.
 *
 * @param props.listingId - Draft listing being edited.
 * @param props.defaults - Saved IMEI last-4, unlock flag, and carrier.
 * @returns Security wizard step form.
 * @calledBy ListingSecurityPage
 */
export function SecurityForm({ listingId, defaults }: SecurityFormProps) {
  const action = updateListingSecurityAction.bind(null, listingId);
  const [state, formAction, pending] = useActionState<
    ListingActionState,
    FormData
  >(action, null);
  const [unlocked, setUnlocked] = useState(
    defaults?.unlocked === false ? "false" : "true",
  );
  const [carrier, setCarrier] = useState(
    matchColombianOperator(defaults?.carrier) ?? "",
  );
  const lockedToOperator = unlocked === "false";

  return (
    <form action={formAction} className="space-y-4">
      <div className="border-border bg-muted/40 space-y-2 rounded-xl border p-4 text-sm">
        <p className="text-foreground font-medium">IMEI y Activation Lock</p>
        <p className="text-muted-foreground">
          Encuentra el IMEI en Ajustes → General → Información. No publicamos el
          IMEI completo: solo guardamos un resumen seguro y los últimos 4
          dígitos.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imei">IMEI (15 dígitos)</Label>
        <Input
          id="imei"
          name="imei"
          inputMode="numeric"
          required
          minLength={15}
          maxLength={15}
          placeholder={
            defaults?.imeiLast4
              ? `Actual termina en ${defaults.imeiLast4}`
              : "356938035643809"
          }
        />
        {state?.ok === false && state.fieldErrors?.imei?.[0] ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.imei[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="activationLocked">¿Activation Lock activo?</Label>
        <Select
          id="activationLocked"
          name="activationLocked"
          required
          defaultValue="false"
        >
          <option value="false">No — está desactivado</option>
          <option value="true">Sí — todavía activo</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="unlocked">Liberación</Label>
        <Select
          id="unlocked"
          name="unlocked"
          required
          value={unlocked}
          onChange={(event) => {
            const next = event.target.value;
            setUnlocked(next);
            if (next === "true") setCarrier("");
          }}
        >
          <option value="true">Libre de fábrica / liberado</option>
          <option value="false">Con operador</option>
        </Select>
      </div>

      {lockedToOperator ? (
        <div className="space-y-2">
          <Label htmlFor="carrier">Operador</Label>
          <Select
            id="carrier"
            name="carrier"
            required
            value={carrier}
            onChange={(event) => setCarrier(event.target.value)}
          >
            <option value="" disabled>
              Selecciona
            </option>
            {COLOMBIAN_OPERATORS.map((operator) => (
              <option key={operator} value={operator}>
                {operator}
              </option>
            ))}
          </Select>
          {state?.ok === false && state.fieldErrors?.carrier?.[0] ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.carrier[0]}
            </p>
          ) : null}
        </div>
      ) : null}

      {state?.ok === false ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" fullWidth loading={pending}>
        Continuar
      </Button>
    </form>
  );
}
