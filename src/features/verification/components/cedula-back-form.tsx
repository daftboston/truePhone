"use client";

/**
 * @file cedula-back-form.tsx
 * @description CedulaBackForm component for the verification feature.tsx.
 * @dependencies react, @/features/verification/actions/identity, @/features/verification/types, @/components/ui/button, @/components/ui/file-input
 */

import { useActionState } from "react";

import { saveCedulaBackAction } from "@/features/verification/actions/identity";
import type { VerificationActionState } from "@/features/verification/types";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import { Label } from "@/components/ui/label";

/**
 * CedulaBackForm
 *
 * Renders the Cedula Back Form UI for verification.
 *
 * @param props - CedulaBackForm props.
 * @returns CedulaBackForm React element.
 * @calledBy verification pages and parent components
 */
export function CedulaBackForm() {
  const [state, formAction, pending] = useActionState<
    VerificationActionState,
    FormData
  >(saveCedulaBackAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="backImage">Foto del reverso</Label>
        <FileInput
          id="backImage"
          name="backImage"
          accept="image/jpeg,image/png,image/webp"
          required
          buttonLabel="Elegir de la galería"
          cameraLabel="Tomar foto"
          captureFacing="environment"
        />
        <p className="text-muted-foreground text-xs">
          Asegúrate de que el código de barras o QR se vea completo.
        </p>
      </div>

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
