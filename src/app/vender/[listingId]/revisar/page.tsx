import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ListingWizardShell } from "@/features/listings/components/listing-wizard-shell";
import { ReviewListingForm } from "@/features/listings/components/review-listing-form";
import { isSellerIdentityVerified } from "@/features/verification/types";
import { getCurrentProfile } from "@/lib/auth/session";
import { getOwnedListing } from "@/lib/listings";

type PageProps = {
  params: Promise<{ listingId: string }>;
};

export const metadata: Metadata = {
  title: "Revisar anuncio",
};

export default async function ListingReviewPage({ params }: PageProps) {
  const { listingId } = await params;
  const current = await getCurrentProfile();
  if (!current) redirect(`/login?next=/vender/${listingId}/revisar`);
  if (!isSellerIdentityVerified(current.profile.verifikStatus)) {
    redirect("/vender");
  }

  const listing = await getOwnedListing(listingId, current.profile.id);
  if (!listing) notFound();
  if (listing.status !== "DRAFT") redirect(`/vender/${listingId}/enviado`);

  const galleryCount = listing.images.filter(
    (image) => image.imageType === "gallery",
  ).length;

  return (
    <AppShell mainClassName="max-w-lg">
      <ListingWizardShell
        step={5}
        title="Revisa y envía"
        listingId={listing.id}
      >
        <ReviewListingForm
          listingId={listing.id}
          title={listing.title}
          condition={listing.condition}
          batteryHealth={listing.batteryHealth}
          price={listing.price}
          platformFee={listing.platformFee}
          finalPrice={listing.finalPrice}
          imeiLast4={listing.imeiLast4}
          galleryCount={galleryCount}
          hasPossessionPhoto={Boolean(listing.possessionChallenge?.photoUrl)}
          description={listing.description}
        />
      </ListingWizardShell>
    </AppShell>
  );
}
