/**
 * @file page.tsx
 * @description Queue of reported or flagged marketplace reviews.
 * @dependencies Review moderation helpers
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ReviewCard } from "@/components/review-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReviewModerationActions } from "@/features/reviews/components/review-moderation-actions";
import {
  canAccessReviewPortal,
  getCurrentProfile,
  roleLabel,
} from "@/lib/auth/session";
import { listOpenReviewReports, reviewAuthorName } from "@/lib/reviews";

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
export default async function ReviewReportsPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/resenas");

  if (!canAccessReviewPortal(current.profile.role)) {
    return (
      <AppShell mainClassName="max-w-lg justify-center">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden moderar reseñas."
          action={
            <Button asChild variant="outline">
              <Link href="/revision">Volver a revisión</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const reports = await listOpenReviewReports(80);

  return (
    <AppShell mainClassName="max-w-3xl gap-8">
      <div className="space-y-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/revision">← Cola de confianza</Link>
        </Button>
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

      {reports.length === 0 ? (
        <EmptyState
          title="Sin reportes abiertos"
          description="Cuando alguien reporte una reseña, aparecerá aquí."
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
                <span className="font-mono">
                  {report.review.order.id.slice(0, 8)}
                </span>
              </p>
              <ReviewModerationActions reviewId={report.review.id} />
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
