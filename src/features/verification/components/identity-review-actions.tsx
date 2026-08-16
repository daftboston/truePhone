"use client";

/**
 * @file identity-review-actions.tsx
 * @description IdentityReviewActions component for the verification feature.tsx.
 * @dependencies react, @/features/verification/actions/identity, @/features/verification/types, @/components/ui/button, @/components/ui/input
 */

import { useActionState } from "react";

import {
  approveIdentityVerificationAction,
  rejectIdentityVerificationAction,
} from "@/features/verification/actions/identity";
import type { VerificationActionState } from "@/features/verification/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type IdentityReviewActionsProps = {
  verificationId: string;
  documentLast4: string | null;
  sellerName: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  selfieImageUrl: string | null;
  docsAvailable: boolean;
};

/**
 * IdentityReviewActions
 *
 * Renders the Identity Review Actions UI for verification.
 *
 * @param props - IdentityReviewActions props.
 * @returns IdentityReviewActions React element.
 * @calledBy verification pages and parent components
 */
export function IdentityReviewActions({
  verificationId,
  documentLast4,
  sellerName,
  frontImageUrl,
  backImageUrl,
  selfieImageUrl,
  docsAvailable,
}: IdentityReviewActionsProps) {
  const [approveState, approveAction, approvePending] = useActionState<
    VerificationActionState,
    FormData
  >(approveIdentityVerificationAction, null);

  const [rejectState, rejectAction, rejectPending] = useActionState<
    VerificationActionState,
    FormData
  >(rejectIdentityVerificationAction, null);

  return (
    <div className="border-border space-y-4 rounded-xl border p-4">
      <div>
        <p className="text-foreground text-sm font-semibold">{sellerName}</p>
        <p className="text-muted-foreground text-xs">
          Cédula •••• {documentLast4 ?? "????"} · revisión manual
        </p>
      </div>

      {docsAvailable ? (
        <div className="grid grid-cols-3 gap-2">
          <DocThumb href={frontImageUrl} label="Frente" />
          <DocThumb href={backImageUrl} label="Reverso" />
          <DocThumb href={selfieImageUrl} label="Selfie" />
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          Para ver las fotos, agrega{" "}
          <code className="text-foreground">SUPABASE_SERVICE_ROLE_KEY</code> al
          entorno del servidor.
        </p>
      )}

      <form action={approveAction}>
        <input type="hidden" name="verificationId" value={verificationId} />
        <Button type="submit" fullWidth loading={approvePending}>
          Aprobar identidad
        </Button>
      </form>
      {approveState?.ok === true ? (
        <p className="text-success text-xs" role="status">
          {approveState.message}
        </p>
      ) : null}
      {approveState?.ok === false ? (
        <p className="text-destructive text-xs" role="alert">
          {approveState.error}
        </p>
      ) : null}

      <form action={rejectAction} className="space-y-3">
        <input type="hidden" name="verificationId" value={verificationId} />
        <div className="space-y-2">
          <Label htmlFor={`reason-${verificationId}`}>Motivo de rechazo</Label>
          <Input
            id={`reason-${verificationId}`}
            name="rejectionReason"
            required
            placeholder="Ej. La selfie no coincide con la cédula"
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          fullWidth
          loading={rejectPending}
        >
          Rechazar
        </Button>
      </form>
      {rejectState?.ok === true ? (
        <p className="text-success text-xs" role="status">
          {rejectState.message}
        </p>
      ) : null}
      {rejectState?.ok === false ? (
        <p className="text-destructive text-xs" role="alert">
          {rejectState.error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * DocThumb
 *
 * Renders the Doc Thumb UI for verification.
 *
 * @param props - DocThumb props.
 * @returns DocThumb React element.
 * @calledBy verification pages and parent components
 */
function DocThumb({ href, label }: { href: string | null; label: string }) {
  if (!href) {
    return (
      <div className="bg-muted text-muted-foreground flex aspect-[3/4] items-center justify-center rounded-lg text-[10px]">
        {label}
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="bg-muted relative block aspect-[3/4] overflow-hidden rounded-lg"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={href} alt={label} className="size-full object-cover" />
      <span className="bg-background/80 text-foreground absolute inset-x-0 bottom-0 truncate px-1 py-0.5 text-center text-[10px]">
        {label}
      </span>
    </a>
  );
}
