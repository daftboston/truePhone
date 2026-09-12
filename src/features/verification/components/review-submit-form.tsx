"use client";

/**
 * @file review-submit-form.tsx
 * @description Identity review checklist with photo thumbs and submit.
 * @dependencies react, next/link, identity submit action, Button
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { submitIdentityVerificationAction } from "@/features/verification/actions/identity";
import { Button } from "@/components/ui/button";

type ReviewSubmitFormProps = {
  documentLast4: string | null;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  selfieImageUrl: string | null;
};

/**
 * IdentityReviewThumb
 *
 * Labeled identity photo linking back to the capture step.
 *
 * @param props.href - Capture step path.
 * @param props.imageUrl - Signed URL, or null when missing.
 * @param props.label - Slot label.
 * @returns Linked thumb or Falta state.
 * @calledBy ReviewSubmitForm
 */
function IdentityReviewThumb({
  href,
  imageUrl,
  label,
}: {
  href: string;
  imageUrl: string | null;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="border-border bg-muted relative block overflow-hidden rounded-xl border"
    >
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- signed identity URLs */}
          <img
            src={imageUrl}
            alt={label}
            className="aspect-[3/4] w-full object-cover"
          />
          <span className="bg-background/80 text-foreground absolute inset-x-0 bottom-0 px-1 py-0.5 text-center text-[10px] font-medium">
            {label}
          </span>
        </>
      ) : (
        <div className="flex aspect-[3/4] flex-col items-center justify-center gap-1 px-2 text-center">
          <p className="text-foreground text-xs font-medium">{label}</p>
          <p className="text-muted-foreground text-[11px]">
            Falta · tocar para agregar
          </p>
        </div>
      )}
    </Link>
  );
}

/**
 * ReviewSubmitForm
 *
 * Lets the seller confirm identity photos visually before sending to review.
 *
 * @param props.documentLast4 - Masked cédula digits.
 * @param props.frontImageUrl - Signed front photo, if any.
 * @param props.backImageUrl - Signed back photo, if any.
 * @param props.selfieImageUrl - Signed selfie, if any.
 * @returns Review + submit UI.
 * @calledBy `/verificacion/revisar`
 */
export function ReviewSubmitForm({
  documentLast4,
  frontImageUrl,
  backImageUrl,
  selfieImageUrl,
}: ReviewSubmitFormProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const complete = Boolean(frontImageUrl && backImageUrl && selfieImageUrl);

  return (
    <div className="space-y-5">
      <dl className="border-border space-y-3 rounded-xl border p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Cédula (últimos 4)</dt>
          <dd className="text-foreground font-medium">
            {documentLast4 ? `•••• ${documentLast4}` : "—"}
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-3 gap-2">
        <IdentityReviewThumb
          href="/verificacion/cedula-frente"
          imageUrl={frontImageUrl}
          label="Frente"
        />
        <IdentityReviewThumb
          href="/verificacion/cedula-reverso"
          imageUrl={backImageUrl}
          label="Reverso"
        />
        <IdentityReviewThumb
          href="/verificacion/selfie"
          imageUrl={selfieImageUrl}
          label="Selfie"
        />
      </div>

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
        disabled={!complete}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const result = await submitIdentityVerificationAction();
              if (result && result.ok === false) {
                setError(result.error);
              }
            } catch (caught) {
              if (isRedirectError(caught)) throw caught;
            }
          });
        }}
      >
        Enviar para revisión
      </Button>
    </div>
  );
}
