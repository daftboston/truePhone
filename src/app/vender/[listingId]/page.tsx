import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SellerListingSummary } from "@/features/listings/components/seller-listing-summary";
import { isSellerIdentityVerified } from "@/features/verification/types";
import { getCurrentProfile } from "@/lib/auth/session";
import { getOwnedListing, getSellerDraftResumePath } from "@/lib/listings";

type PageProps = {
  params: Promise<{ listingId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { listingId } = await params;
  const current = await getCurrentProfile();
  if (!current) return { title: "Tu anuncio" };

  const listing = await getOwnedListing(listingId, current.profile.id);
  return {
    title: listing ? listing.title : "Tu anuncio",
  };
}

export default async function SellerListingPage({ params }: PageProps) {
  const { listingId } = await params;
  const current = await getCurrentProfile();
  if (!current) redirect(`/login?next=/vender/${listingId}`);
  if (!isSellerIdentityVerified(current.profile.verifikStatus)) {
    redirect("/vender");
  }

  const listing = await getOwnedListing(listingId, current.profile.id);
  if (!listing) notFound();

  if (listing.status === "DRAFT") {
    redirect(getSellerDraftResumePath(listing));
  }

  return (
    <AppShell mainClassName="max-w-lg gap-6">
      <SellerListingSummary listing={listing} />
    </AppShell>
  );
}
