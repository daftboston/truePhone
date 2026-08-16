"use client";

/**
 * @file thread-safety-actions.tsx
 * @description ThreadSafetyActions component for the messages feature.tsx.
 * @dependencies react, next/navigation, @/components/ui/button, @/components/ui/textarea, @/features/messages/actions/messages
 */

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  blockUserAction,
  reportConversationAction,
  unblockUserAction,
} from "@/features/messages/actions/messages";
import type { MessageActionState } from "@/features/messages/schemas/message";

type ThreadSafetyActionsProps = {
  listingId: string;
  otherUserId: string;
  initiallyBlockedByMe: boolean;
};

const reportInitial: MessageActionState = null;

/**
 * ThreadSafetyActions
 *
 * Renders the Thread Safety Actions UI for messages.
 *
 * @param props - ThreadSafetyActions props.
 * @returns ThreadSafetyActions React element.
 * @calledBy messages pages and parent components
 */
export function ThreadSafetyActions({
  listingId,
  otherUserId,
  initiallyBlockedByMe,
}: ThreadSafetyActionsProps) {
  const router = useRouter();
  const [blockedByMe, setBlockedByMe] = useState(initiallyBlockedByMe);
  const [showReport, setShowReport] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [blockPending, startBlockTransition] = useTransition();
  const [reportState, reportAction, reportPending] = useActionState(
    reportConversationAction,
    reportInitial,
  );

  function onToggleBlock() {
    setBlockError(null);
    startBlockTransition(async () => {
      const result = blockedByMe
        ? await unblockUserAction(otherUserId, listingId)
        : await blockUserAction(otherUserId, listingId);
      if (!result || !result.ok) {
        setBlockError(result?.error ?? "No se pudo actualizar el bloqueo.");
        return;
      }
      setBlockedByMe(!blockedByMe);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={blockPending}
          onClick={onToggleBlock}
        >
          {blockedByMe ? "Desbloquear" : "Bloquear"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowReport((open) => !open)}
          aria-expanded={showReport}
        >
          Reportar
        </Button>
      </div>

      {blockError ? (
        <p className="text-destructive text-sm" role="alert">
          {blockError}
        </p>
      ) : null}

      {showReport ? (
        <form
          action={reportAction}
          className="border-border space-y-2 rounded-xl border p-3"
        >
          <input type="hidden" name="listingId" value={listingId} />
          <label
            htmlFor="report-reason"
            className="text-foreground text-sm font-medium"
          >
            Motivo del reporte
          </label>
          <Textarea
            id="report-reason"
            name="reason"
            placeholder="Describe qué ocurrió (mínimo 10 caracteres)…"
            required
            minLength={10}
            maxLength={1000}
            className="min-h-24"
            disabled={reportPending}
          />
          {reportState && !reportState.ok ? (
            <p className="text-destructive text-sm" role="alert">
              {reportState.fieldErrors?.reason?.[0] ?? reportState.error}
            </p>
          ) : null}
          {reportState?.ok ? (
            <p className="text-muted-foreground text-sm" role="status">
              {reportState.message ?? "Reporte enviado."}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowReport(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={reportPending}>
              Enviar reporte
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
