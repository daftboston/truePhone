/**
 * @file listing-qa-section.tsx
 * @description Public listing Q&A thread mounted on listing detail.
 * @dependencies next/link, @/components/empty-state, @/components/ui/badge, @/lib/listing-qa
 */

import type { ListingStatus } from "@prisma/client";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnswerQuestionForm } from "@/features/listing-qa/components/answer-question-form";
import { AskQuestionForm } from "@/features/listing-qa/components/ask-question-form";
import { DeleteQuestionButton } from "@/features/listing-qa/components/delete-question-button";
import { ReportQaButton } from "@/features/listing-qa/components/report-qa-button";
import {
  listingQaAuthorName,
  listListingQuestions,
  type ListingQaViewer,
} from "@/lib/listing-qa";

type ListingQaSectionProps = {
  listingId: string;
  listingStatus: ListingStatus;
  sellerId: string;
  viewer: ListingQaViewer;
  isAuthenticated: boolean;
  loginHref: string;
};

/**
 * formatWhen
 *
 * Formats Q&A timestamps for es-CO display.
 *
 * @param date - Created-at timestamp.
 * @returns Localized short date-time.
 * @calledBy ListingQaSection
 */
function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * ListingQaSection
 *
 * Renders the public Preguntas thread: read for guests, ask for buyers,
 * official answers for the seller.
 *
 * @param props.listingId - Listing UUID.
 * @param props.listingStatus - Current listing status.
 * @param props.sellerId - Listing owner profile UUID.
 * @param props.viewer - Current viewer (id + staff).
 * @param props.isAuthenticated - Whether a session exists.
 * @param props.loginHref - Login link with #preguntas.
 * @returns Public Q&A section.
 * @calledBy PublicListingPage
 */
export async function ListingQaSection({
  listingId,
  listingStatus,
  sellerId,
  viewer,
  isAuthenticated,
  loginHref,
}: ListingQaSectionProps) {
  const questions = await listListingQuestions({
    listingId,
    sellerId,
    viewer,
  });
  const publicCount = questions.filter((question) => !question.hiddenAt).length;
  const isSeller = viewer.profileId === sellerId;
  const canAsk = isAuthenticated && !isSeller && listingStatus === "PUBLISHED";

  return (
    <section id="preguntas" className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-foreground text-lg font-semibold">Preguntas</h2>
        <p className="text-muted-foreground text-sm">
          {publicCount === 1 ? "1 pregunta" : `${publicCount} preguntas`}
        </p>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          title="Aún no hay preguntas"
          description="Pregunta sobre este iPhone. Las respuestas del vendedor son públicas."
        />
      ) : (
        <ul className="space-y-4">
          {questions.map((question) => {
            const isAsker = viewer.profileId === question.askerId;
            const visibleAnswer = question.answer;
            const canDelete = isAsker && !question.answer && !question.hiddenAt;
            const canSellerAnswer =
              isSeller &&
              !question.answer &&
              !question.hiddenAt &&
              (listingStatus === "PUBLISHED" || listingStatus === "RESERVED");

            return (
              <li
                key={question.id}
                className="border-border space-y-3 rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-foreground text-sm font-semibold">
                    {listingQaAuthorName(question.asker)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatWhen(question.createdAt)}
                  </p>
                  {question.hiddenAt ? (
                    <Badge variant="outline">Oculta</Badge>
                  ) : null}
                </div>
                <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {question.body}
                </p>
                {isAuthenticated && !isAsker && !question.hiddenAt ? (
                  <ReportQaButton
                    questionId={question.id}
                    loginHref={loginHref}
                  />
                ) : null}
                {canDelete ? (
                  <DeleteQuestionButton
                    questionId={question.id}
                    loginHref={loginHref}
                  />
                ) : null}

                {visibleAnswer ? (
                  <div className="border-border bg-muted/40 space-y-2 rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-foreground text-sm font-semibold">
                        Respuesta del vendedor
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatWhen(visibleAnswer.updatedAt)}
                      </p>
                      {visibleAnswer.hiddenAt ? (
                        <Badge variant="outline">Oculta</Badge>
                      ) : null}
                    </div>
                    <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                      {visibleAnswer.body}
                    </p>
                    {isAuthenticated &&
                    viewer.profileId !== sellerId &&
                    !visibleAnswer.hiddenAt ? (
                      <ReportQaButton
                        answerId={visibleAnswer.id}
                        loginHref={loginHref}
                      />
                    ) : null}
                    {isSeller &&
                    !visibleAnswer.hiddenAt &&
                    (listingStatus === "PUBLISHED" ||
                      listingStatus === "RESERVED") ? (
                      <AnswerQuestionForm
                        questionId={question.id}
                        answerId={visibleAnswer.id}
                        initialBody={visibleAnswer.body}
                        loginHref={loginHref}
                      />
                    ) : null}
                  </div>
                ) : null}

                {canSellerAnswer ? (
                  <AnswerQuestionForm
                    questionId={question.id}
                    loginHref={loginHref}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {canAsk ? (
        <div className="border-border space-y-2 rounded-xl border p-4">
          <h3 className="text-foreground text-sm font-semibold">
            Pregunta sobre este iPhone
          </h3>
          <AskQuestionForm listingId={listingId} loginHref={loginHref} />
        </div>
      ) : null}

      {!isAuthenticated ? (
        <div className="flex justify-start">
          <Button asChild variant="outline" size="sm">
            <Link href={loginHref}>Iniciar sesión para preguntar</Link>
          </Button>
        </div>
      ) : null}

      {isSeller && listingStatus === "PUBLISHED" ? (
        <p className="text-muted-foreground text-xs">
          Las preguntas son públicas. Para negociar usa el chat privado del
          anuncio.
        </p>
      ) : null}
    </section>
  );
}
