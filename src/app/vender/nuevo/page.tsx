/**
 * @file page.tsx
 * @description Start a new listing draft in the sell wizard.
 * @dependencies Listing create form / wizard step
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DeviceDetailsForm } from "@/features/listings/components/device-details-form";
import { ListingWizardShell } from "@/features/listings/components/listing-wizard-shell";
import { isSellerIdentityVerified } from "@/features/verification/types";
import { getCurrentProfile } from "@/lib/auth/session";
import { getCatalog } from "@/lib/listings";
import { getSellerPriceGuideMap } from "@/lib/recommended-prices";

export const metadata: Metadata = {
  title: "Nuevo anuncio",
};

/**
 * NewListingPage
 *
 * Entry step to create a new seller listing draft.
 *
 * @returns New listing wizard page.
 */
export default async function NewListingPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/vender/nuevo");
  if (!isSellerIdentityVerified(current.profile.verifikStatus)) {
    redirect("/vender");
  }

  const [catalog, priceGuideByCombo] = await Promise.all([
    getCatalog(),
    getSellerPriceGuideMap(),
  ]);
  if (
    catalog.models.length === 0 ||
    catalog.colors.length === 0 ||
    catalog.storages.length === 0
  ) {
    return (
      <AppShell mainClassName="max-w-lg">
        <ListingWizardShell step={1} title="Catálogo no listo">
          <p className="text-muted-foreground text-sm">
            Todavía no hay modelos cargados. Ejecuta{" "}
            <code className="text-foreground">npm run db:seed</code> y vuelve a
            intentar.
          </p>
        </ListingWizardShell>
      </AppShell>
    );
  }

  return (
    <AppShell mainClassName="gap-4 md:gap-6">
      <ListingWizardShell step={1} title="Datos del dispositivo">
        <DeviceDetailsForm
          models={catalog.models}
          colors={catalog.colors}
          storages={catalog.storages}
          colorIdsByModelId={catalog.colorIdsByModelId}
          priceGuideByCombo={priceGuideByCombo}
        />
      </ListingWizardShell>
    </AppShell>
  );
}
