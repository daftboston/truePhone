import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listingStatusLabel } from "@/features/listings/schemas/listing";
import { isSellerIdentityVerified } from "@/features/verification/types";
import { getCurrentProfile } from "@/lib/auth/session";
import { getOwnedListing } from "@/lib/listings";

type PageProps = {
  params: Promise<{ listingId: string }>;
};

export const metadata: Metadata = {
  title: "Anuncio enviado",
};

export default async function ListingSubmittedPage({ params }: PageProps) {
  const { listingId } = await params;
  const current = await getCurrentProfile();
  if (!current) redirect(`/login?next=/vender/${listingId}/enviado`);
  if (!isSellerIdentityVerified(current.profile.verifikStatus)) {
    redirect("/vender");
  }

  const listing = await getOwnedListing(listingId, current.profile.id);
  if (!listing) notFound();

  if (listing.status === "DRAFT") {
    redirect(`/vender/${listing.id}/revisar`);
  }

  return (
    <AppShell mainClassName="max-w-lg justify-center gap-4">
      <EmptyState
        title="Anuncio enviado a revisión"
        description="Un revisor de TruePhone validará las fotos, el IMEI y la prueba de posesión antes de publicarlo."
        action={
          <Button asChild>
            <Link href="/vender">Volver a mis anuncios</Link>
          </Button>
        }
      />
      <div className="flex justify-center">
        <Badge variant="outline">{listingStatusLabel(listing.status)}</Badge>
      </div>
    </AppShell>
  );
}
