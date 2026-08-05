"use client";

/**
 * @file review-form.tsx
 * @description ReviewForm component for the reviews feature.tsx.
 * @dependencies react, next/navigation, @/components/ui/button, @/components/ui/label, @/components/ui/textarea
 */

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createReviewAction } from "@/features/reviews/actions/reviews";
import {
  REVIEW_COMMENT_MAX,
  type ReviewActionState,
} from "@/features/reviews/schemas/review";

type ReviewFormProps = {
  orderId: string;
  counterpartLabel: string;
};

const initial: ReviewActionState = null;

const RATINGS = [5, 4, 3, 2, 1] as const;

/**
 * ReviewForm
 *
 * Renders the Review Form UI for reviews.
 *
 * @param props - ReviewForm props.
 * @returns ReviewForm React element.
 * @calledBy reviews pages and parent components
 */
export function ReviewForm({ orderId, counterpartLabel }: ReviewFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createReviewAction, initial);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="space-y-2">
        <Label htmlFor={`rating-${orderId}`}>
          Calificación para {counterpartLabel}
        </Label>
        <div
          id={`rating-${orderId}`}
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label={`Calificación para ${counterpartLabel}`}
        >
          {RATINGS.map((value) => (
            <label
              key={value}
              className="border-border has-[:checked]:border-primary has-[:checked]:bg-primary/5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm"
            >
              <input
                type="radio"
                name="rating"
                value={value}
                required
                disabled={pending}
                className="sr-only"
              />
              <span aria-hidden>{"★".repeat(value)}</span>
              <span className="text-muted-foreground tabular-nums">
                {value}
              </span>
            </label>
          ))}
        </div>
        {state && !state.ok && state.fieldErrors?.rating?.[0] ? (
          <p className="text-destructive text-sm" role="alert">
            {state.fieldErrors.rating[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`comment-${orderId}`}>Comentario (opcional)</Label>
        <Textarea
          id={`comment-${orderId}`}
          name="comment"
          placeholder="Cuéntanos cómo fue la experiencia…"
          maxLength={REVIEW_COMMENT_MAX}
          className="min-h-24"
          disabled={pending}
        />
        {state && !state.ok && state.fieldErrors?.comment?.[0] ? (
          <p className="text-destructive text-sm" role="alert">
            {state.fieldErrors.comment[0]}
          </p>
        ) : null}
      </div>

      {state && !state.ok && !state.fieldErrors ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" fullWidth loading={pending}>
        Publicar reseña
      </Button>
    </form>
  );
}
