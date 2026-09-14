/**
 * @file page.tsx
 * @description Queue of reported or flagged marketplace reviews.
 * @dependencies Review moderation helpers
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { QueueTabs } from "@/components/queue-tabs";
import { ReviewCard } from "@/components/review-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReviewModerationActions } from "@/features/reviews/components/review-moderation-actions";
import {
  canAccessReviewPortal,
  getCurrentProfile,
  roleLabel,
} from "@/lib/auth/session";
import {
  countOpenReviewReports,
  countResolvedReviewReports,
  listOpenReviewReports,
  listResolvedReviewReports,
  reviewAuthorName,
} from "@/lib/reviews";
import { publicListingPath } from "@/lib/listings-marketplace";

export const metadata: Metadata = {
  title: "Reseñas reportadas",
  description: "Moderación de reseñas del marketplace.",
};

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * ReviewReportsPage
 *
 * Lists review reports for staff moderation.
 *
 * @returns Review reports queue.
 */
type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function ReviewReportsPage({ searchParams }: PageProps) {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/resenas");

  if (!canAccessReviewPortal(current.profile.role)) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden moderar reseñas."
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
      ? listResolvedReviewReports(80)
      : listOpenReviewReports(80),
    countOpenReviewReports(),
    countResolvedReviewReports(),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Reseñas reportadas
          </h1>
          <Badge variant="outline">{roleLabel(current.profile.role)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Reportes abiertos de reseñas abusivas o engañosas.
        </p>
      </div>

      <QueueTabs
        active={tab}
        ariaLabel="Filtros de reseñas"
        tabs={[
          {
            id: "abiertos",
            label: "Abiertos",
            href: "/revision/resenas",
            count: openCount,
          },
          {
            id: "resueltos",
            label: "Resueltos",
            href: "/revision/resenas?tab=resueltos",
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
              : "Cuando alguien reporte una reseña, aparecerá aquí."
          }
          action={
            <Button asChild variant="outline">
              <Link href="/revision">Volver al centro</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => (
            <li
              key={report.id}
              className="border-border space-y-3 rounded-xl border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-foreground text-sm font-semibold">
                  {report.review.order.listing.title}
                </p>
                <p className="text-muted-foreground text-xs">
                  Reportado {formatWhen(report.createdAt)}
                </p>
              </div>
              <p className="text-muted-foreground text-sm">
                Reportado por {reviewAuthorName(report.reporter)}:{" "}
                <span className="text-foreground">{report.reason}</span>
              </p>
              <ReviewCard
                reviewerName={reviewAuthorName(report.review.reviewer)}
                reviewerAvatarUrl={report.review.reviewer.avatarUrl}
                rating={report.review.rating}
                comment={report.review.comment}
                transactionDate={report.review.createdAt}
              />
              <p className="text-muted-foreground text-xs">
                Sobre {reviewAuthorName(report.review.reviewedUser)} · pedido{" "}
                <span className="font-mono break-all">
                  {report.review.order.id}
                </span>
              </p>
              {report.review.order.listing.slug ? (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={publicListingPath(report.review.order.listing.slug)}
                  >
                    Ver anuncio
                  </Link>
                </Button>
              ) : null}
              {tab === "abiertos" ? (
                <ReviewModerationActions reviewId={report.review.id} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
