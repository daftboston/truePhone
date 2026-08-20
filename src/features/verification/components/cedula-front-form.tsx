"use client";

/**
 * @file cedula-front-form.tsx
 * @description CedulaFrontForm component for the verification feature.tsx.
 * @dependencies react, @/features/verification/actions/identity, @/features/verification/types, @/components/ui/button, @/components/ui/file-input, @/components/ui/input
 */

import { useActionState } from "react";

import { saveCedulaFrontAction } from "@/features/verification/actions/identity";
import type { VerificationActionState } from "@/features/verification/types";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * CedulaFrontForm
 *
 * Renders the Cedula Front Form UI for verification.
 *
 * @param props - CedulaFrontForm props.
 * @returns CedulaFrontForm React element.
 * @calledBy verification pages and parent components
 */
export function CedulaFrontForm() {
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
          required
          placeholder="Solo dígitos"
        />
        {state?.ok === false && state.fieldErrors?.documentNumber?.[0] ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.documentNumber[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="frontImage">Foto del frente</Label>
        <FileInput
          id="frontImage"
          name="frontImage"
          accept="image/jpeg,image/png,image/webp"
          required
          buttonLabel="Elegir de la galería"
          cameraLabel="Tomar foto"
          captureFacing="environment"
        />
        <p className="text-muted-foreground text-xs">
          Buena luz, sin reflejos. JPG, PNG o WebP · máx. 5 MB.
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
