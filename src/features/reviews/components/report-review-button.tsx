"use client";

/**
 * @file report-review-button.tsx
 * @description ReportReviewButton component for the reviews feature.tsx.
 * @dependencies react, @/components/ui/button, @/components/ui/textarea, @/features/reviews/actions/reviews, @/features/reviews/schemas/review
 */

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reportReviewAction } from "@/features/reviews/actions/reviews";
import type { ReviewActionState } from "@/features/reviews/schemas/review";

type ReportReviewButtonProps = {
  reviewId: string;
};

const initial: ReviewActionState = null;

/**
 * ReportReviewButton
 *
 * Renders the Report Review Button UI for reviews.
 *
 * @param props - ReportReviewButton props.
 * @returns ReportReviewButton React element.
 * @calledBy reviews pages and parent components
 */
export function ReportReviewButton({ reviewId }: ReportReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(reportReviewAction, initial);

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

  return (
    <form
      action={action}
      className="border-border space-y-2 rounded-lg border p-3"
    >
      <input type="hidden" name="reviewId" value={reviewId} />
      <label
        htmlFor={`report-review-${reviewId}`}
        className="text-foreground text-sm font-medium"
      >
        Motivo del reporte
      </label>
      <Textarea
        id={`report-review-${reviewId}`}
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
