"use client";

/**
 * @file review-submit-form.tsx
 * @description ReviewSubmitForm component for the verification feature.tsx.
 * @dependencies react, @/features/verification/actions/identity, @/components/ui/button
 */

import { useState, useTransition } from "react";

import { submitIdentityVerificationAction } from "@/features/verification/actions/identity";
import { Button } from "@/components/ui/button";

type ReviewSubmitFormProps = {
  documentLast4: string | null;
  hasFront: boolean;
  hasBack: boolean;
  hasSelfie: boolean;
};

/**
 * ReviewSubmitForm
 *
 * Renders the Review Submit Form UI for verification.
 *
 * @param props - ReviewSubmitForm props.
 * @returns ReviewSubmitForm React element.
 * @calledBy verification pages and parent components
 */
export function ReviewSubmitForm({
  documentLast4,
  hasFront,
  hasBack,
  hasSelfie,
}: ReviewSubmitFormProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <dl className="border-border space-y-3 rounded-xl border p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Cédula (últimos 4)</dt>
          <dd className="text-foreground font-medium">
            {documentLast4 ? `•••• ${documentLast4}` : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Frente</dt>
          <dd className="text-foreground">{hasFront ? "Listo" : "Falta"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Reverso</dt>
          <dd className="text-foreground">{hasBack ? "Listo" : "Falta"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Selfie</dt>
          <dd className="text-foreground">{hasSelfie ? "Listo" : "Falta"}</dd>
        </div>
      </dl>

      <p className="text-muted-foreground text-sm">
        Al enviar, un revisor de TruePhone validará tu identidad antes de
        permitirte publicar anuncios.
      </p>

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
              const result = await submitIdentityVerificationAction();
              if (result && result.ok === false) {
                setError(result.error);
              }
            } catch {
              // redirect
            }
          });
        }}
      >
        Enviar para revisión
      </Button>
    </div>
  );
}
