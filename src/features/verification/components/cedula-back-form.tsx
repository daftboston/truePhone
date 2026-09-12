"use client";

/**
 * @file cedula-back-form.tsx
 * @description Cédula back photo capture with preview.
 * @dependencies react, identity actions, IdentityCaptureFrame, UI primitives
 */

import { useActionState } from "react";

import { saveCedulaBackAction } from "@/features/verification/actions/identity";
import { IdentityCaptureFrame } from "@/features/verification/components/identity-capture-frame";
import type { VerificationActionState } from "@/features/verification/types";
import { Button } from "@/components/ui/button";

type CedulaBackFormProps = {
  existingImageUrl?: string | null;
};

/**
 * CedulaBackForm
 *
 * Captures the back of the Colombian ID. Revisits can keep the saved photo.
 *
 * @param props.existingImageUrl - Signed URL of a saved back photo.
 * @returns Cédula back form.
 * @calledBy `/verificacion/cedula-reverso`
 */
export function CedulaBackForm({
  existingImageUrl = null,
}: CedulaBackFormProps) {
  const [state, formAction, pending] = useActionState<
    VerificationActionState,
    FormData
  >(saveCedulaBackAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <IdentityCaptureFrame
        variant="cedula"
        inputId="backImage"
        inputName="backImage"
        label="Reverso de la cédula"
        why="El código debe verse completo para validar el documento."
        how="Asegúrate de que el código de barras o QR se vea completo."
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
