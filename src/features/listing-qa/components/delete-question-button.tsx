"use client";

/**
 * @file delete-question-button.tsx
 * @description Asker control to delete an unanswered public question.
 * @dependencies react, next/navigation, @/components/ui/button
 */

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteOwnUnansweredQuestionAction } from "@/features/listing-qa/actions/listing-qa";
import type { ListingQaActionState } from "@/features/listing-qa/schemas/listing-qa";

type DeleteQuestionButtonProps = {
  questionId: string;
  loginHref: string;
};

const initial: ListingQaActionState = null;

/**
 * DeleteQuestionButton
 *
 * Deletes the asker's unanswered question after submit.
 *
 * @param props.questionId - Question UUID.
 * @param props.loginHref - Login redirect when the session expired.
 * @returns Delete form button.
 * @calledBy ListingQaSection
 */
export function DeleteQuestionButton({
  questionId,
  loginHref,
}: DeleteQuestionButtonProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    deleteOwnUnansweredQuestionAction,
    initial,
  );

  useEffect(() => {
    if (state && !state.ok && state.loginRequired) {
      router.push(loginHref);
    }
    if (state?.ok) {
      router.refresh();
    }
  }, [state, loginHref, router]);

  return (
    <form action={action}>
      <input type="hidden" name="questionId" value={questionId} />
      <Button type="submit" variant="ghost" size="sm" loading={pending}>
        Eliminar
      </Button>
      {state && !state.ok && !state.loginRequired ? (
        <p className="text-destructive text-xs" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
