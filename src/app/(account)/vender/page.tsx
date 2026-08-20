/**
 * @file page.tsx
 * @description Seller hub listing the user's drafts and published listings.
 * @dependencies Listings seller helpers and account shell
 */

import type { Metadata } from "next";
import Link from "next/link";

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
import { requireCurrentProfile } from "@/lib/auth/session";
import { getSellerDraftResumePath, listSellerListings } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Vender",
};

/**
 * SellPage
 *
 * Entry hub for creating and managing the seller's own listings.
 *
 * @returns Seller listings hub.
 */
export default async function SellPage() {
  const current = await requireCurrentProfile("/vender");

  const verification = await getLatestIdentityVerification(current.profile.id);
  const status = current.profile.verifikStatus;
  const verified = isSellerIdentityVerified(status);

  if (!verified) {
    const continuePath =
      status === "pending"
        ? "/verificacion/enviada"
        : status === "rejected"
          ? "/verificacion"
          : verification
            ? nextVerificationPath(verification)
            : "/verificacion";

    return (
      <>
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
      </>
    );
  }

  const listings = await listSellerListings(current.profile.id);

  return (
    <>
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
          secondaryAction={
            <Button asChild variant="ghost" size="sm">
              <Link href="/ayuda#vender">Cómo vender</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {listings.map((listing) => {
            const href =
              listing.status === "DRAFT"
                ? getSellerDraftResumePath(listing)
                : `/vender/${listing.id}`;
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
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {listingStatusLabel(listing.status)}
                  </Badge>
                  {listing.status === "REJECTED" ? (
                    <Link
                      href={`/vender/${listing.id}`}
                      className="text-destructive text-xs font-medium underline-offset-2 hover:underline"
                    >
                      Ver motivo
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
