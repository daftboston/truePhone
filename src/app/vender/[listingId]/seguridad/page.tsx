import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ListingWizardShell } from "@/features/listings/components/listing-wizard-shell";
import { SecurityForm } from "@/features/listings/components/security-form";
import { isSellerIdentityVerified } from "@/features/verification/types";
import { getCurrentProfile } from "@/lib/auth/session";
import { getOwnedListing } from "@/lib/listings";

type PageProps = {
  params: Promise<{ listingId: string }>;
};

export const metadata: Metadata = {
  title: "Seguridad del equipo",
};

export default async function ListingSecurityPage({ params }: PageProps) {
  const { listingId } = await params;
  const current = await getCurrentProfile();
  if (!current) redirect(`/login?next=/vender/${listingId}/seguridad`);
  if (!isSellerIdentityVerified(current.profile.verifikStatus)) {
    redirect("/vender");
  }

  const listing = await getOwnedListing(listingId, current.profile.id);
  if (!listing) notFound();
  if (listing.status !== "DRAFT") redirect(`/vender/${listingId}/enviado`);

  return (
    <AppShell mainClassName="max-w-lg">
      <ListingWizardShell
        step={3}
        title="IMEI y Activation Lock"
        listingId={listing.id}
      >
        <SecurityForm
          listingId={listing.id}
          defaults={{
            imeiLast4: listing.imeiLast4,
            unlocked: listing.unlocked,
            carrier: listing.carrier,
          }}
        />
      </ListingWizardShell>
    </AppShell>
  );
}
