import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  conditionLabels,
  listingStatusLabel,
} from "@/features/listings/schemas/listing";
import {
  isSellerIdentityVerified,
  nextVerificationPath,
  verificationStatusLabel,
} from "@/features/verification/types";
import { getLatestIdentityVerification } from "@/lib/auth/identity";
import { getCurrentProfile } from "@/lib/auth/session";
import { listSellerListings } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Vender",
};

export default async function SellPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/vender");

  const verification = await getLatestIdentityVerification(current.profile.id);
  const status = current.profile.verifikStatus;
  const verified = isSellerIdentityVerified(status);

  if (!verified) {
    const continuePath =
      status === "pending"
        ? "/verificacion/enviada"
        : verification
          ? nextVerificationPath(verification)
          : "/verificacion";

    return (
      <AppShell mainClassName="max-w-lg justify-center gap-4">
        <EmptyState
          title="Verifica tu identidad para vender"
          description="En TruePhone solo publican vendedores con cédula y selfie revisadas."
          action={
            <Button asChild>
              <Link href={continuePath}>
                {status === "pending"
                  ? "Ver estado"
                  : status === "rejected"
                    ? "Volver a intentar"
                    : status === "draft"
                      ? "Continuar verificación"
                      : "Empezar verificación"}
              </Link>
            </Button>
          }
        />
        <div className="flex justify-center">
          <Badge variant="outline">
            Estado: {verificationStatusLabel(status)}
          </Badge>
        </div>
      </AppShell>
    );
  }

  const listings = await listSellerListings(current.profile.id);

  return (
    <AppShell mainClassName="max-w-lg gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Tus anuncios
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Crea un borrador, completa la posesión del equipo y envíalo a
            revisión.
          </p>
        </div>
        <Button asChild>
          <Link href="/vender/nuevo">Nuevo</Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="Aún no tienes anuncios"
          description="Publica tu primer iPhone con fotos, IMEI y prueba de posesión."
          action={
            <Button asChild>
              <Link href="/vender/nuevo">Crear anuncio</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {listings.map((listing) => {
            const href =
              listing.status === "DRAFT"
                ? `/vender/${listing.id}/dispositivo`
                : `/vender/${listing.id}/enviado`;
            return (
              <div key={listing.id} className="space-y-2">
                <ListingCard
                  href={href}
                  title={listing.title}
                  imageUrl={listing.images[0]?.imageUrl}
                  price={listing.price}
                  batteryHealth={listing.batteryHealth ?? undefined}
                  conditionLabel={conditionLabels[listing.condition]}
                />
                <Badge variant="outline">
                  {listingStatusLabel(listing.status)}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
