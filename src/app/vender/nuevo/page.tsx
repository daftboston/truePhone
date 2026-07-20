import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DeviceDetailsForm } from "@/features/listings/components/device-details-form";
import { ListingWizardShell } from "@/features/listings/components/listing-wizard-shell";
import { isSellerIdentityVerified } from "@/features/verification/types";
import { getCurrentProfile } from "@/lib/auth/session";
import { getCatalog } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Nuevo anuncio",
};

export default async function NewListingPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/vender/nuevo");
  if (!isSellerIdentityVerified(current.profile.verifikStatus)) {
    redirect("/vender");
  }

  const catalog = await getCatalog();
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
    <AppShell mainClassName="max-w-lg">
      <ListingWizardShell step={1} title="Datos del dispositivo">
        <DeviceDetailsForm
          models={catalog.models}
          colors={catalog.colors}
          storages={catalog.storages}
          colorIdsByModelId={catalog.colorIdsByModelId}
        />
      </ListingWizardShell>
    </AppShell>
  );
}
