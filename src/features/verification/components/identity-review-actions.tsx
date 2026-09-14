"use client";

/**
 * @file identity-review-actions.tsx
 * @description Approve/reject controls for a claimed identity verification.
 * @dependencies react, ConfirmAction, identity actions, UI primitives
 */

import { useActionState } from "react";
import Link from "next/link";

import { ConfirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  approveIdentityVerificationAction,
  rejectIdentityVerificationAction,
} from "@/features/verification/actions/identity";
import type { VerificationActionState } from "@/features/verification/types";

type IdentityReviewActionsProps = {
  verificationId: string;
  documentLast4: string | null;
  canApprove: boolean;
  canReject: boolean;
  docsAvailable: boolean;
  assignedLabel: string | null;
  nextHref: string | null;
};

/**
 * IdentityReviewActions
 *
 * Renders two-step approve/reject for identity review. Approve stays disabled
 * when documents are missing; reject remains available with a reason.
 *
 * @param props.verificationId - Case id.
 * @param props.documentLast4 - Masked cédula digits.
 * @param props.canApprove - True when the actor may approve and docs exist.
 * @param props.canReject - True when the actor may reject.
 * @param props.docsAvailable - Signed document URLs loaded.
 * @param props.assignedLabel - Assignee copy, or null.
 * @param props.nextHref - Next unclaimed case, if any.
 * @returns Decision panel.
 * @calledBy Identity review detail page
 */
export function IdentityReviewActions({
  verificationId,
  documentLast4,
  canApprove,
  canReject,
  docsAvailable,
  assignedLabel,
  nextHref,
}: IdentityReviewActionsProps) {
  const [approveState, approveAction, approvePending] = useActionState<
    VerificationActionState,
    FormData
  >(approveIdentityVerificationAction, null);

  const [rejectState, rejectAction, rejectPending] = useActionState<
    VerificationActionState,
    FormData
  >(rejectIdentityVerificationAction, null);

  const decided = approveState?.ok === true || rejectState?.ok === true;

  return (
    <div className="border-border space-y-4 rounded-xl border p-4">
      <div>
        <p className="text-foreground text-sm font-semibold">Decisión</p>
        <p className="text-muted-foreground text-xs">
          Cédula •••• {documentLast4 ?? "????"}
        </p>
        {assignedLabel ? (
          <p className="text-muted-foreground mt-1 text-xs">{assignedLabel}</p>
        ) : null}
      </div>

      {!docsAvailable ? (
        <p className="text-muted-foreground text-xs">
          Las fotos de identidad no están disponibles ahora. Un administrador
          debe revisar la configuración de almacenamiento. Puedes rechazar el
          caso si falta evidencia.
        </p>
      ) : null}

      {decided ? (
        <div className="space-y-3">
          <p className="text-success text-sm" role="status">
            {approveState?.ok === true
              ? approveState.message
              : rejectState?.ok === true
                ? rejectState.message
                : null}
          </p>
          {nextHref ? (
            <Button asChild fullWidth>
              <Link href={nextHref}>Siguiente en la cola</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" fullWidth>
              <Link href="/revision/identidad">Volver a la cola</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          {canApprove ? (
            <form action={approveAction}>
              <input
                type="hidden"
                name="verificationId"
                value={verificationId}
              />
              <ConfirmAction
                type="submit"
                idleLabel="Aprobar identidad"
                confirmLabel="Confirmar aprobación"
                hint="La persona podrá publicar anuncios después de esta aprobación."
                pending={approvePending}
              />
            </form>
          ) : (
            <Button type="button" fullWidth disabled>
              Aprobar identidad
            </Button>
          )}
          {approveState?.ok === false ? (
            <p className="text-destructive text-xs" role="alert">
              {approveState.error}
            </p>
          ) : null}

          {canReject ? (
            <form action={rejectAction} className="space-y-3">
              <input
                type="hidden"
                name="verificationId"
                value={verificationId}
              />
              <div className="space-y-2">
                <Label htmlFor={`reason-${verificationId}`}>
                  Motivo de rechazo
                </Label>
                <Input
                  id={`reason-${verificationId}`}
                  name="rejectionReason"
                  required
                  placeholder="Ej. La selfie no coincide con la cédula"
                />
              </div>
              <ConfirmAction
                type="submit"
                variant="outline"
                idleLabel="Rechazar"
                confirmLabel="Confirmar rechazo"
                hint="El vendedor verá este motivo y podrá volver a enviar su identidad."
                pending={rejectPending}
              />
            </form>
          ) : null}
          {rejectState?.ok === false ? (
            <p className="text-destructive text-xs" role="alert">
              {rejectState.error}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
