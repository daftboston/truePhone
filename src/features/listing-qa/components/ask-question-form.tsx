"use client";

/**
 * @file ask-question-form.tsx
 * @description Public listing question composer for signed-in buyers.
 * @dependencies react, next/navigation, @/components/ui/button, @/components/ui/textarea
 */

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askListingQuestionAction } from "@/features/listing-qa/actions/listing-qa";
import {
  LISTING_QA_BODY_MAX,
  type ListingQaActionState,
} from "@/features/listing-qa/schemas/listing-qa";

type AskQuestionFormProps = {
  listingId: string;
  loginHref: string;
};

const initial: ListingQaActionState = null;

/**
 * AskQuestionForm
 *
 * Lets a signed-in non-owner ask a public question on a listing.
 *
 * @param props.listingId - Listing UUID.
 * @param props.loginHref - Login redirect when the session expired.
 * @returns Question form.
 * @calledBy ListingQaSection
 */
export function AskQuestionForm({
  listingId,
  loginHref,
}: AskQuestionFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    askListingQuestionAction,
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
      <input type="hidden" name="listingId" value={listingId} />
      <label htmlFor={`ask-question-${listingId}`} className="sr-only">
        Pregunta sobre este iPhone
      </label>
      <Textarea
        id={`ask-question-${listingId}`}
        name="body"
        placeholder="Pregunta sobre el estado, la batería o los accesorios…"
        required
        maxLength={LISTING_QA_BODY_MAX}
        className="min-h-24"
        disabled={pending}
      />
      <p className="text-muted-foreground text-xs leading-relaxed">
        No publiques teléfonos ni WhatsApp. Para negociar o comprar usa Compra
        Garantizada o Contactar vendedor.
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
          Publicar pregunta
        </Button>
      </div>
    </form>
  );
}
