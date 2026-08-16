/**
 * @file page.tsx
 * @description Queue of listings awaiting manual review.
 * @dependencies ReviewQueueRow and listing review loaders
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { ReviewQueueRow } from "@/components/review-queue-row";
import { Button } from "@/components/ui/button";
import { ListingReviewTabs } from "@/features/listings/components/listing-review-tabs";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  countListingsForReview,
  listListingsForReview,
  parseListingReviewTab,
  reviewStatusLabel,
  sellerDisplayName,
} from "@/lib/listings-review";

export const metadata: Metadata = {
  title: "Cola de anuncios",
};

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

/**
 * ListingReviewQueuePage
 *
 * Lists listings pending reviewer decision.
 *
 * @returns Listing review queue.
 */
export default async function ListingReviewQueuePage({
  searchParams,
}: PageProps) {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/anuncios");

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
  const tab = parseListingReviewTab(params.tab);
  const [listings, counts] = await Promise.all([
    listListingsForReview(tab),
    countListingsForReview(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Cola de anuncios
        </h1>
        <p className="text-muted-foreground text-sm">
          Revisa pendientes y consulta el historial de aprobados y rechazados.
        </p>
      </div>

      <ListingReviewTabs active={tab} counts={counts} />

      {listings.length === 0 ? (
        <EmptyState
          title="No hay anuncios en esta cola"
          description={
            tab === "aprobados" || tab === "rechazados" || tab === "todos"
              ? "Aún no hay anuncios en este filtro."
              : "Cuando un vendedor envíe un anuncio a revisión, aparecerá aquí."
          }
          action={
            <Button asChild variant="outline">
              <Link href="/revision">Volver al centro</Link>
            </Button>
          }
        />
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          {listings.map((listing) => {
            const thumb = listing.images[0]?.imageUrl;
            const stamp = (
              listing.reviewedAt ?? listing.updatedAt
            ).toLocaleString("es-CO", {
              dateStyle: "medium",
              timeStyle: "short",
            });
            return (
              <ReviewQueueRow
                key={listing.id}
                href={`/revision/anuncios/${listing.id}`}
                title={listing.title}
                sellerName={sellerDisplayName(listing.seller)}
                submittedAt={stamp}
                imageUrl={thumb}
                statusLabel={reviewStatusLabel(listing)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
