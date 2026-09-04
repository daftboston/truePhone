"use client";

/**
 * @file answer-question-form.tsx
 * @description Seller official-answer composer and editor for listing Q&A.
 * @dependencies react, next/navigation, @/components/ui/button, @/components/ui/textarea
 */

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  answerListingQuestionAction,
  editListingAnswerAction,
} from "@/features/listing-qa/actions/listing-qa";
import {
  LISTING_QA_BODY_MAX,
  type ListingQaActionState,
} from "@/features/listing-qa/schemas/listing-qa";

type AnswerQuestionFormProps = {
  questionId: string;
  answerId?: string;
  initialBody?: string;
  loginHref: string;
};

const initial: ListingQaActionState = null;

/**
 * AnswerQuestionForm
 *
 * Creates or edits the seller's official answer.
 *
 * @param props.questionId - Question UUID for create.
 * @param props.answerId - Answer UUID when editing.
 * @param props.initialBody - Existing answer text.
 * @param props.loginHref - Login redirect when the session expired.
 * @returns Answer form.
 * @calledBy ListingQaSection, SellerListingQaHint
 */
export function AnswerQuestionForm({
  questionId,
  answerId,
  initialBody,
  loginHref,
}: AnswerQuestionFormProps) {
  const router = useRouter();
  const isEdit = Boolean(answerId);
  const [state, action, pending] = useActionState(
    isEdit ? editListingAnswerAction : answerListingQuestionAction,
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
    <form action={action} className="space-y-3">
      {isEdit ? (
        <input type="hidden" name="answerId" value={answerId} />
      ) : (
        <input type="hidden" name="questionId" value={questionId} />
      )}
      <label
        htmlFor={`answer-question-${answerId ?? questionId}`}
        className="sr-only"
      >
        Respuesta oficial
      </label>
      <Textarea
        id={`answer-question-${answerId ?? questionId}`}
        name="body"
        defaultValue={initialBody}
        placeholder="Responde para todos los compradores…"
        required
        maxLength={LISTING_QA_BODY_MAX}
        className="min-h-20"
        disabled={pending}
      />
      <p className="text-muted-foreground text-xs leading-relaxed">
        No publiques teléfonos ni WhatsApp. Esta respuesta es pública.
      </p>
      {state && !state.ok && !state.loginRequired ? (
        <p className="text-destructive text-sm" role="alert">
          {state.fieldErrors?.body?.[0] ?? state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.message}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending}>
          {isEdit ? "Guardar respuesta" : "Publicar respuesta"}
        </Button>
      </div>
    </form>
  );
}
