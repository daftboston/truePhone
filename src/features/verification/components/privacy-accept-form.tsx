"use client";

import { useState, useTransition } from "react";

import { acceptPrivacyAction } from "@/features/verification/actions/identity";
import { Button } from "@/components/ui/button";

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
            } catch {
              // redirect() throws; ignore navigation errors
            }
          });
        }}
      >
        Entiendo y deseo continuar
      </Button>
    </div>
  );
}
