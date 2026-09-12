"use client";

/**
 * @file selfie-form.tsx
 * @description Selfie capture with oval preview and camera-first mobile CTA.
 * @dependencies react, identity actions, IdentityCaptureFrame, UI primitives
 */

import { useActionState } from "react";

import { saveSelfieAction } from "@/features/verification/actions/identity";
import { IdentityCaptureFrame } from "@/features/verification/components/identity-capture-frame";
import type { VerificationActionState } from "@/features/verification/types";
import { Button } from "@/components/ui/button";

type SelfieFormProps = {
  existingImageUrl?: string | null;
};

/**
 * SelfieForm
 *
 * Captures the seller selfie used to match the cédula.
 *
 * @param props.existingImageUrl - Signed URL of a saved selfie.
 * @returns Selfie form.
 * @calledBy `/verificacion/selfie`
 */
export function SelfieForm({ existingImageUrl = null }: SelfieFormProps) {
  const [state, formAction, pending] = useActionState<
    VerificationActionState,
    FormData
  >(saveSelfieAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="border-border bg-muted/40 space-y-2 rounded-xl border p-4 text-sm">
        <p className="text-foreground font-medium">Consejos para tu selfie</p>
        <ul className="text-muted-foreground list-disc space-y-1 pl-4">
          <li>Mira de frente a la cámara, sin gafas oscuras ni gorra.</li>
          <li>Usa luz natural y un fondo simple.</li>
          <li>Esta foto se compara con tu cédula.</li>
        </ul>
      </div>

      <IdentityCaptureFrame
        variant="selfie"
        inputId="selfieImage"
        inputName="selfieImage"
        label="Tu rostro"
        why="La comparamos con tu cédula para confirmar que eres tú. Solo un revisor de TruePhone la ve."
        existingImageUrl={existingImageUrl}
        captureFacing="user"
        cameraPrimary
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
