"use client";

/**
 * @file qa-moderation-actions.tsx
 * @description Staff hide/dismiss controls for reported listing Q&A.
 * @dependencies react, next/navigation, @/components/ui/button
 */

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  dismissListingQuestionReportsAction,
  hideListingAnswerAction,
  hideListingQuestionAction,
} from "@/features/listing-qa/actions/listing-qa";
import type { ListingQaActionState } from "@/features/listing-qa/schemas/listing-qa";

type QaModerationActionsProps = {
  questionId?: string;
  answerId?: string;
};

const initial: ListingQaActionState = null;

/**
 * QaModerationActions
 *
 * Lets reviewers hide a question or answer, or dismiss open reports.
 *
 * @param props.questionId - Question UUID when moderating a question.
 * @param props.answerId - Answer UUID when moderating an answer.
 * @returns Staff action buttons.
 * @calledBy /revision/preguntas
 */
export function QaModerationActions({
  questionId,
  answerId,
}: QaModerationActionsProps) {
  const router = useRouter();
  const [hideState, hideAction, hidePending] = useActionState(
    questionId ? hideListingQuestionAction : hideListingAnswerAction,
    initial,
  );
  const [dismissState, dismissAction, dismissPending] = useActionState(
    dismissListingQuestionReportsAction,
    initial,
  );

  useEffect(() => {
    if (hideState?.ok || dismissState?.ok) {
      router.refresh();
    }
  }, [hideState, dismissState, router]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={hideAction}>
          {questionId ? (
            <input type="hidden" name="questionId" value={questionId} />
          ) : (
            <input type="hidden" name="answerId" value={answerId} />
          )}
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            loading={hidePending}
          >
            {questionId ? "Ocultar pregunta" : "Ocultar respuesta"}
          </Button>
        </form>
        <form action={dismissAction}>
          {questionId ? (
            <input type="hidden" name="questionId" value={questionId} />
          ) : null}
          {answerId ? (
            <input type="hidden" name="answerId" value={answerId} />
          ) : null}
          <Button
            type="submit"
            variant="outline"
            size="sm"
            loading={dismissPending}
          >
            Descartar reportes
          </Button>
        </form>
      </div>
      {hideState && !hideState.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {hideState.error}
        </p>
      ) : null}
      {dismissState && !dismissState.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {dismissState.error}
        </p>
      ) : null}
      {hideState?.ok || dismissState?.ok ? (
        <p className="text-muted-foreground text-sm" role="status">
          {hideState?.ok
            ? hideState.message
            : dismissState?.ok
              ? dismissState.message
              : null}
        </p>
      ) : null}
    </div>
  );
}
