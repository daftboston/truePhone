/**
 * @file page.tsx
 * @description Queue of reported public listing questions and answers.
 * @dependencies Review portal access checks and listing Q&A moderation
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { QueueTabs } from "@/components/queue-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QaModerationActions } from "@/features/listing-qa/components/qa-moderation-actions";
import {
  canAccessReviewPortal,
  getCurrentProfile,
  roleLabel,
} from "@/lib/auth/session";
import {
  countOpenListingQuestionReports,
  countResolvedListingQuestionReports,
  listingQaAuthorName,
  listingQaPublicHref,
  listOpenListingQuestionReports,
  listResolvedListingQuestionReports,
} from "@/lib/listing-qa";

export const metadata: Metadata = {
  title: "Preguntas reportadas",
  description: "Moderación de preguntas y respuestas públicas de anuncios.",
};

/**
 * formatWhen
 *
 * Formats report timestamps for es-CO display.
 *
 * @param date - Created-at timestamp.
 * @returns Localized short date-time.
 * @calledBy ListingQuestionReportsPage
 */
function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * ListingQuestionReportsPage
 *
 * Lists open listing Q&A reports for staff hide or dismiss.
 *
 * @returns Q&A reports queue.
 */
type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function ListingQuestionReportsPage({
  searchParams,
}: PageProps) {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/preguntas");

  if (!canAccessReviewPortal(current.profile.role)) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden moderar preguntas."
          action={
            <Button asChild variant="outline">
              <Link href="/revision">Volver a revisión</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const params = await searchParams;
  const tab = params.tab === "resueltos" ? "resueltos" : "abiertos";
  const [reports, openCount, resolvedCount] = await Promise.all([
    tab === "resueltos"
      ? listResolvedListingQuestionReports(80)
      : listOpenListingQuestionReports(80),
    countOpenListingQuestionReports(),
    countResolvedListingQuestionReports(),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Preguntas reportadas
          </h1>
          <Badge variant="outline">{roleLabel(current.profile.role)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Reportes abiertos de preguntas o respuestas públicas.
        </p>
      </div>

      <QueueTabs
        active={tab}
        ariaLabel="Filtros de preguntas"
        tabs={[
          {
            id: "abiertos",
            label: "Abiertos",
            href: "/revision/preguntas",
            count: openCount,
          },
          {
            id: "resueltos",
            label: "Resueltos",
            href: "/revision/preguntas?tab=resueltos",
            count: resolvedCount,
          },
        ]}
      />

      {reports.length === 0 ? (
        <EmptyState
          title={
            tab === "resueltos"
              ? "Sin reportes resueltos"
              : "Sin reportes abiertos"
          }
          description={
            tab === "resueltos"
              ? "Cuando ocultes o descartes un reporte, aparecerá aquí."
              : "Cuando alguien reporte una pregunta o respuesta, aparecerá aquí."
          }
          action={
            <Button asChild variant="outline">
              <Link href="/revision">Volver al centro</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => {
            const question = report.question ?? report.answer?.question;
            const listing = question?.listing;
            const isAnswer = Boolean(report.answerId);

            return (
              <li
                key={report.id}
                className="border-border space-y-3 rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-foreground text-sm font-semibold">
                    {listing?.title ?? "Anuncio"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Reportado {formatWhen(report.createdAt)}
                  </p>
                </div>
                <p className="text-muted-foreground text-sm">
                  Reportado por {listingQaAuthorName(report.reporter)}:{" "}
                  <span className="text-foreground">{report.reason}</span>
                </p>
                <Badge variant="outline">
                  {isAnswer ? "Respuesta" : "Pregunta"}
                </Badge>
                {report.question ? (
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {listingQaAuthorName(report.question.asker)}
                    </p>
                    <p className="text-foreground text-sm whitespace-pre-wrap">
                      {report.question.body}
                    </p>
                  </div>
                ) : null}
                {report.answer ? (
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      Respuesta de {listingQaAuthorName(report.answer.seller)}
                    </p>
                    <p className="text-foreground text-sm whitespace-pre-wrap">
                      {report.answer.body}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Sobre la pregunta de{" "}
                      {listingQaAuthorName(report.answer.question.asker)}:{" "}
                      {report.answer.question.body}
                    </p>
                  </div>
                ) : null}
                {listing?.slug ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={listingQaPublicHref(listing.slug)}>
                      Ver anuncio
                    </Link>
                  </Button>
                ) : null}
                {tab === "abiertos" ? (
                  <QaModerationActions
                    questionId={report.questionId ?? undefined}
                    answerId={report.answerId ?? undefined}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
