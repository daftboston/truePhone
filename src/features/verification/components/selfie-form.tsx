"use client";

/**
 * @file selfie-form.tsx
 * @description SelfieForm component for the verification feature.tsx.
 * @dependencies react, @/features/verification/actions/identity, @/features/verification/types, @/components/ui/button, @/components/ui/input
 */

import { useActionState } from "react";

import { saveSelfieAction } from "@/features/verification/actions/identity";
import type { VerificationActionState } from "@/features/verification/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * SelfieForm
 *
 * Renders the Selfie Form UI for verification.
 *
 * @param props - SelfieForm props.
 * @returns SelfieForm React element.
 * @calledBy verification pages and parent components
 */
export function SelfieForm() {
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
          <li>
            Esta foto se compara con tu cédula. Más adelante conectaremos
            liveness biométrico.
          </li>
        </ul>
      </div>

      <div className="space-y-2">
        <Label htmlFor="selfieImage">Selfie</Label>
        <Input
          id="selfieImage"
          name="selfieImage"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          required
          className="cursor-pointer pt-2"
        />
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
