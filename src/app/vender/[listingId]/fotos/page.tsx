import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { GalleryUploadForm } from "@/features/listings/components/gallery-upload-form";
import { ListingWizardShell } from "@/features/listings/components/listing-wizard-shell";
import { isSellerIdentityVerified } from "@/features/verification/types";
import { getCurrentProfile } from "@/lib/auth/session";
import { getOwnedListing } from "@/lib/listings";

type PageProps = {
  params: Promise<{ listingId: string }>;
};

export const metadata: Metadata = {
  title: "Fotos del anuncio",
};

export default async function ListingPhotosPage({ params }: PageProps) {
  const { listingId } = await params;
  const current = await getCurrentProfile();
  if (!current) redirect(`/login?next=/vender/${listingId}/fotos`);
  if (!isSellerIdentityVerified(current.profile.verifikStatus)) {
    redirect("/vender");
  }

  const listing = await getOwnedListing(listingId, current.profile.id);
  if (!listing) notFound();
  if (listing.status !== "DRAFT") redirect(`/vender/${listingId}`);

  const gallery = listing.images.filter(
    (image) => image.imageType === "gallery",
  );

  return (
    <AppShell mainClassName="max-w-lg">
      <ListingWizardShell
        step={2}
        title="Fotos del iPhone"
        listingId={listing.id}
        rejectionReason={listing.rejectionReason}
      >
        <GalleryUploadForm listingId={listing.id} images={gallery} />
      </ListingWizardShell>
    </AppShell>
  );
}
