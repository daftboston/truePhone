import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ListingWizardShell } from "@/features/listings/components/listing-wizard-shell";
import { PossessionForm } from "@/features/listings/components/possession-form";
import { isSellerIdentityVerified } from "@/features/verification/types";
import { getCurrentProfile } from "@/lib/auth/session";
import { ensurePossessionChallenge, getOwnedListing } from "@/lib/listings";

type PageProps = {
  params: Promise<{ listingId: string }>;
};

export const metadata: Metadata = {
  title: "Prueba de posesión",
};

export default async function ListingPossessionPage({ params }: PageProps) {
  const { listingId } = await params;
  const current = await getCurrentProfile();
  if (!current) redirect(`/login?next=/vender/${listingId}/posesion`);
  if (!isSellerIdentityVerified(current.profile.verifikStatus)) {
    redirect("/vender");
  }

  const listing = await getOwnedListing(listingId, current.profile.id);
  if (!listing) notFound();
  if (listing.status !== "DRAFT") redirect(`/vender/${listingId}/enviado`);

  const challenge =
    listing.possessionChallenge ??
    (await ensurePossessionChallenge(listing.id));

  return (
    <AppShell mainClassName="max-w-lg">
      <ListingWizardShell
        step={4}
        title="Prueba de posesión"
        listingId={listing.id}
      >
        <PossessionForm
          listingId={listing.id}
          code={challenge.code}
          photoUrl={challenge.photoUrl}
        />
      </ListingWizardShell>
    </AppShell>
  );
}
