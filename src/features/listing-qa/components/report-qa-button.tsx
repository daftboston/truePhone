"use client";

/**
 * @file report-qa-button.tsx
 * @description Report control for a public listing question or answer.
 * @dependencies react, next/navigation, @/components/ui/button, @/components/ui/textarea
 */

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reportListingQuestionAction } from "@/features/listing-qa/actions/listing-qa";
import type { ListingQaActionState } from "@/features/listing-qa/schemas/listing-qa";

type ReportQaButtonProps = {
  questionId?: string;
  answerId?: string;
  loginHref: string;
};

const initial: ListingQaActionState = null;

/**
 * ReportQaButton
 *
 * Collects a reason and reports a question or answer for staff review.
 *
 * @param props.questionId - Question UUID when reporting a question.
 * @param props.answerId - Answer UUID when reporting an answer.
 * @param props.loginHref - Login redirect when the session expired.
 * @returns Report toggle + form.
 * @calledBy ListingQaSection
 */
export function ReportQaButton({
  questionId,
  answerId,
  loginHref,
}: ReportQaButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    reportListingQuestionAction,
    initial,
  );

  useEffect(() => {
    if (state && !state.ok && state.loginRequired) {
      router.push(loginHref);
    }
  }, [state, loginHref, router]);

  if (state?.ok) {
    return (
      <p className="text-muted-foreground text-xs" role="status">
        {state.message}
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Reportar
      </Button>
    );
  }

  const fieldId = `report-qa-${questionId ?? answerId}`;

  return (
    <form
      action={action}
      className="border-border space-y-2 rounded-lg border p-3"
    >
      {questionId ? (
        <input type="hidden" name="questionId" value={questionId} />
      ) : null}
      {answerId ? (
        <input type="hidden" name="answerId" value={answerId} />
      ) : null}
      <label htmlFor={fieldId} className="text-foreground text-sm font-medium">
        Motivo del reporte
      </label>
      <Textarea
        id={fieldId}
        name="reason"
        placeholder="Describe qué ocurrió (mínimo 10 caracteres)…"
        required
        minLength={10}
        maxLength={1000}
        className="min-h-20"
        disabled={pending}
      />
      {state && !state.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {state.fieldErrors?.reason?.[0] ?? state.error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" loading={pending}>
          Enviar reporte
        </Button>
      </div>
    </form>
  );
}
