/**
 * @file page.tsx
 * @description Sell wizard step: device details for the listing.
 * @dependencies Device form and listing ownership helpers
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DeviceDetailsForm } from "@/features/listings/components/device-details-form";
import { ListingWizardShell } from "@/features/listings/components/listing-wizard-shell";
import { isSellerIdentityVerified } from "@/features/verification/types";
import { getCurrentProfile } from "@/lib/auth/session";
import { getCatalog, getOwnedListing } from "@/lib/listings";
import { getSellerPriceGuideMap } from "@/lib/recommended-prices";

type PageProps = {
  params: Promise<{ listingId: string }>;
};

export const metadata: Metadata = {
  title: "Editar dispositivo",
};

/**
 * EditDevicePage
 *
 * Collects device attributes (model, storage, condition, etc.) for the listing.
 *
 * @returns Device details wizard step.
 */
export default async function EditDevicePage({ params }: PageProps) {
  const { listingId } = await params;
  const current = await getCurrentProfile();
  if (!current) redirect(`/login?next=/vender/${listingId}/dispositivo`);
  if (!isSellerIdentityVerified(current.profile.verifikStatus)) {
    redirect("/vender");
  }

  const listing = await getOwnedListing(listingId, current.profile.id);
  if (!listing) notFound();
  if (listing.status !== "DRAFT") redirect(`/vender/${listingId}`);

  const [catalog, priceGuideByCombo] = await Promise.all([
    getCatalog(),
    getSellerPriceGuideMap(),
  ]);

  return (
    <AppShell mainClassName="max-w-lg">
      <ListingWizardShell
        step={1}
        title="Datos del dispositivo"
        listingId={listing.id}
        rejectionReason={listing.rejectionReason}
      >
        <DeviceDetailsForm
          models={catalog.models}
          colors={catalog.colors}
          storages={catalog.storages}
          colorIdsByModelId={catalog.colorIdsByModelId}
          priceGuideByCombo={priceGuideByCombo}
          listingId={listing.id}
          defaults={{
            iphoneModelId: listing.iphoneModelId,
            iphoneColorId: listing.iphoneColorId,
            iphoneStorageId: listing.iphoneStorageId,
            condition: listing.condition,
            batteryHealth: listing.batteryHealth,
            price: listing.price,
            description: listing.description,
            hasBox: listing.hasBox,
            hasCharger: listing.hasCharger,
            hasReceipt: listing.hasReceipt,
          }}
        />
      </ListingWizardShell>
    </AppShell>
  );
}
