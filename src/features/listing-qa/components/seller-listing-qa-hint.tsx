/**
 * @file seller-listing-qa-hint.tsx
 * @description Seller hub unanswered-question hint and answer forms.
 * @dependencies next/link, @/components/ui/badge, @/lib/listing-qa
 */

import type { ListingStatus } from "@prisma/client";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnswerQuestionForm } from "@/features/listing-qa/components/answer-question-form";
import {
  listingQaAuthorName,
  listingQaPublicHref,
  listListingQuestions,
} from "@/lib/listing-qa";

type SellerListingQaHintProps = {
  listingId: string;
  listingSlug: string;
  listingStatus: ListingStatus;
  sellerId: string;
};

/**
 * SellerListingQaHint
 *
 * Shows unanswered public questions on the seller listing hub and lets the
 * owner answer while PUBLISHED or RESERVED.
 *
 * @param props.listingId - Listing UUID.
 * @param props.listingSlug - Public listing slug.
 * @param props.listingStatus - Current listing status.
 * @param props.sellerId - Listing owner profile UUID.
 * @returns Seller Q&A hint, or null when there is nothing to show.
 * @calledBy SellerListingSummary
 */
export async function SellerListingQaHint({
  listingId,
  listingSlug,
  listingStatus,
  sellerId,
}: SellerListingQaHintProps) {
  const questions = await listListingQuestions({
    listingId,
    sellerId,
    viewer: { profileId: sellerId, isStaff: false },
  });
  const unanswered = questions.filter(
    (question) => !question.hiddenAt && !question.answer,
  );
  const canAnswer =
    listingStatus === "PUBLISHED" || listingStatus === "RESERVED";

  if (unanswered.length === 0 && listingStatus !== "PUBLISHED") {
    return null;
  }

  const loginHref = `/login?next=${encodeURIComponent(`/vender/${listingId}`)}`;

  return (
    <aside className="border-border space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-foreground text-sm font-semibold">Preguntas</h2>
        {unanswered.length > 0 ? (
          <Badge variant="secondary">
            {unanswered.length === 1
              ? "1 sin responder"
              : `${unanswered.length} sin responder`}
          </Badge>
        ) : null}
      </div>

      {listingStatus === "PUBLISHED" ? (
        <Button asChild variant="outline" size="sm">
          <Link href={listingQaPublicHref(listingSlug)}>
            Ver preguntas públicas
          </Link>
        </Button>
      ) : null}

      {canAnswer && unanswered.length > 0 ? (
        <ul className="space-y-4">
          {unanswered.map((question) => (
            <li key={question.id} className="space-y-2">
              <p className="text-muted-foreground text-xs">
                {listingQaAuthorName(question.asker)}
              </p>
              <p className="text-foreground text-sm whitespace-pre-wrap">
                {question.body}
              </p>
              <AnswerQuestionForm
                questionId={question.id}
                loginHref={loginHref}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {!canAnswer && unanswered.length > 0 ? (
        <p className="text-muted-foreground text-sm">
          Ya no se pueden responder preguntas en este anuncio.
        </p>
      ) : null}
    </aside>
  );
}
