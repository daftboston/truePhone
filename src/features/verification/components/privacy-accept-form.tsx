"use client";

/**
 * @file privacy-accept-form.tsx
 * @description PrivacyAcceptForm component for the verification feature.tsx.
 * @dependencies react, next/link, @/features/verification/actions/identity, @/components/ui/button, @/lib/legal
 */

import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import Link from "next/link";

import { acceptPrivacyAction } from "@/features/verification/actions/identity";
import { Button } from "@/components/ui/button";
import { LEGAL_PATHS } from "@/lib/legal";

/**
 * PrivacyAcceptForm
 *
 * Renders the Privacy Accept Form UI for verification.
 *
 * @param props - PrivacyAcceptForm props.
 * @returns PrivacyAcceptForm React element.
 * @calledBy verification pages and parent components
 */
export function PrivacyAcceptForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="border-border bg-muted/40 space-y-3 rounded-xl border p-4 text-sm">
        <p className="text-foreground font-medium">Cómo usamos tus datos</p>
        <ul className="text-muted-foreground list-disc space-y-2 pl-4">
          <li>
            Solo usamos tu cédula y selfie para verificar que eres quien dices
            ser.
          </li>
          <li>
            No publicamos tu número de documento. Guardamos un resumen seguro y
            los últimos 4 dígitos.
          </li>
          <li>
            Tus archivos se almacenan de forma privada y se revisan antes de
            aprobarte como vendedor.
          </li>
          <li>
            Puedes solicitar la eliminación de estos documentos contactando
            soporte.
          </li>
        </ul>
        <p>
          <Link
            href={LEGAL_PATHS.privacy}
            className="text-trust text-sm font-medium underline-offset-4 hover:underline"
          >
            Lee la política de privacidad
          </Link>
        </p>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        fullWidth
        loading={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const result = await acceptPrivacyAction();
              if (result && result.ok === false) {
                setError(result.error);
              }
            } catch (error) {
              if (isRedirectError(error)) throw error;
            }
          });
        }}
      >
        Entiendo y deseo continuar
      </Button>
    </div>
  );
}
