"use client";

/**
 * @file cedula-front-form.tsx
 * @description Cédula number + front photo capture with preview.
 * @dependencies react, identity actions, IdentityCaptureFrame, UI primitives
 */

import { useActionState } from "react";

import { saveCedulaFrontAction } from "@/features/verification/actions/identity";
import { IdentityCaptureFrame } from "@/features/verification/components/identity-capture-frame";
import type { VerificationActionState } from "@/features/verification/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CedulaFrontFormProps = {
  existingImageUrl?: string | null;
  documentLast4?: string | null;
};

/**
 * CedulaFrontForm
 *
 * Captures the Colombian ID number and front photo. Revisits can keep the
 * saved image and last-4 without re-entering the full number.
 *
 * @param props.existingImageUrl - Signed URL of a saved front photo.
 * @param props.documentLast4 - Stored last-4 digits, if any.
 * @returns Cédula front form.
 * @calledBy `/verificacion/cedula-frente`
 */
export function CedulaFrontForm({
  existingImageUrl = null,
  documentLast4 = null,
}: CedulaFrontFormProps) {
  const [state, formAction, pending] = useActionState<
    VerificationActionState,
    FormData
  >(saveCedulaFrontAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="documentNumber">Número de cédula</Label>
        <Input
          id="documentNumber"
          name="documentNumber"
          inputMode="numeric"
          autoComplete="off"
          required={!documentLast4}
          placeholder="Solo dígitos"
        />
        {documentLast4 ? (
          <p className="text-muted-foreground text-xs">
            Terminada en •••• {documentLast4}. Déjala en blanco para
            conservarla, o escribe el número completo para actualizarla.
          </p>
        ) : null}
        {state?.ok === false && state.fieldErrors?.documentNumber?.[0] ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.documentNumber[0]}
          </p>
        ) : null}
      </div>

      <IdentityCaptureFrame
        variant="cedula"
        inputId="frontImage"
        inputName="frontImage"
        label="Frente de la cédula"
        why="La usamos para confirmar que eres tú. Solo un revisor de TruePhone la ve."
        how="Buena luz, sin reflejos. JPG, PNG o WebP · máx. 4 MB."
        existingImageUrl={existingImageUrl}
        required
      />

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
