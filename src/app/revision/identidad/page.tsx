/**
 * @file page.tsx
 * @description Queue of identity verifications awaiting manual review.
 * @dependencies Identity review loaders, QueueTabs, ReviewQueueRow
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { ReviewQueueRow } from "@/components/review-queue-row";
import { Button } from "@/components/ui/button";
import { IdentityReviewTabs } from "@/features/verification/components/identity-review-tabs";
import {
  countIdentityVerificationsForReview,
  identityReviewStatusBadgeVariant,
  identityReviewStatusLabel,
  identitySellerDisplayName,
  listIdentityVerificationsForReview,
  parseIdentityReviewTab,
} from "@/lib/auth/identity";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Revisión de identidad",
};

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

/**
 * formatIdentityQueueStamp
 *
 * Formats submitted or reviewed timestamps as a relative es-CO phrase.
 *
 * @param date - Instant to format, or null.
 * @returns Relative label, calendar date after a week, or em dash.
 * @calledBy IdentityReviewQueuePage
 */
function formatIdentityQueueStamp(date: Date | null | undefined) {
  if (!date) return "—";
  const minutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `Hace ${days} d`;
  return date.toLocaleDateString("es-CO", { dateStyle: "medium" });
}

/**
 * IdentityReviewQueuePage
 *
 * Lists identity cases by tab. Opening this page does not claim cases.
 *
 * @returns Identity review queue.
 */
export default async function IdentityReviewQueuePage({
  searchParams,
}: PageProps) {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/identidad");

  if (current.profile.role !== "REVIEWER" && current.profile.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden ver esta cola."
          action={
            <Button asChild variant="outline">
              <Link href="/">Volver al inicio</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const params = await searchParams;
  const tab = parseIdentityReviewTab(params.tab);
  const [items, counts] = await Promise.all([
    listIdentityVerificationsForReview(tab),
    countIdentityVerificationsForReview(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Cola de identidad
        </h1>
        <p className="text-muted-foreground text-sm">
          Abre un caso para asignártelo. Revisa cédula y selfie antes de
          aprobar.
        </p>
      </div>

      <IdentityReviewTabs active={tab} counts={counts} />

      {items.length === 0 ? (
        <EmptyState
          title="No hay casos en esta cola"
          description={
            tab === "aprobados" || tab === "rechazados"
              ? "Aún no hay verificaciones en este filtro."
              : "Cuando un vendedor envíe su cédula, aparecerá aquí."
          }
          action={
            <Button asChild variant="outline">
              <Link href="/revision">Volver al centro</Link>
            </Button>
          }
        />
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          {items.map((item) => {
            const stamp = formatIdentityQueueStamp(
              item.reviewedAt ?? item.submittedAt ?? item.updatedAt,
            );
            const assignee = item.reviewer
              ? identitySellerDisplayName(item.reviewer)
              : null;
            return (
              <ReviewQueueRow
                key={item.id}
                href={`/revision/identidad/${item.id}`}
                title={identitySellerDisplayName(item.profile)}
                sellerName={
                  assignee
                    ? `Cédula •••• ${item.documentNumberLast4 ?? "????"} · ${assignee}`
                    : `Cédula •••• ${item.documentNumberLast4 ?? "????"}`
                }
                submittedAt={stamp}
                showThumbnail={false}
                statusLabel={identityReviewStatusLabel(item)}
                statusVariant={identityReviewStatusBadgeVariant(item)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
