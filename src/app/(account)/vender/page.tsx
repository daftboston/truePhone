/**
 * @file page.tsx
 * @description Seller hub for active and archived listings with search, sort, and actions.
 * @dependencies Listings seller helpers, hub query, account shell
 */

import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SellerListingRow } from "@/features/listings/components/seller-listing-row";
import { SellerListingsToolbar } from "@/features/listings/components/seller-listings-toolbar";
import { parseSellerListingsSearchParams } from "@/features/listings/lib/seller-listing-hub";
import {
  isSellerIdentityVerified,
  nextVerificationPath,
  verificationStatusLabel,
} from "@/features/verification/types";
import { getLatestIdentityVerification } from "@/lib/auth/identity";
import { requireCurrentProfile } from "@/lib/auth/session";
import { listSellerListings } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Vender",
};

type SellPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * SellPage
 *
 * Entry hub for creating and managing the seller's own listings.
 *
 * @param props.searchParams - vista, q, estado, and orden filters.
 * @returns Seller listings hub.
 */
export default async function SellPage({ searchParams }: SellPageProps) {
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

  const params = await searchParams;
  const query = parseSellerListingsSearchParams(params);
  const listings = await listSellerListings(current.profile.id, query);
  const archived = query.vista === "archivados";
  const hasFilters = Boolean(query.q || query.estado);
  const clearHref = archived ? "/vender?vista=archivados" : "/vender";

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            {archived ? "Archivados" : "Anuncios activos"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {archived
              ? "Anuncios que retiraste del marketplace y ventas completadas."
              : "Crea un borrador, completa la posesión del equipo y envíalo a revisión."}
          </p>
        </div>
        <Button asChild>
          <Link href="/vender/nuevo">Nuevo anuncio</Link>
        </Button>
      </div>

      <SellerListingsToolbar query={query} />

      {listings.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? "Ningún anuncio coincide"
              : archived
                ? "No tienes anuncios archivados"
                : "Aún no tienes anuncios"
          }
          description={
            hasFilters
              ? "Prueba otra búsqueda o limpia los filtros."
              : archived
                ? "Cuando archives un anuncio publicado, aparecerá aquí para relistarlo."
                : "Publica tu primer iPhone con fotos, IMEI y prueba de posesión."
          }
          action={
            hasFilters ? (
              <Button asChild variant="outline">
                <Link href={clearHref}>Limpiar filtros</Link>
              </Button>
            ) : archived ? undefined : (
              <Button asChild>
                <Link href="/vender/nuevo">Crear anuncio</Link>
              </Button>
            )
          }
          secondaryAction={
            archived || hasFilters ? undefined : (
              <Button asChild variant="ghost" size="sm">
                <Link href="/ayuda#vender">Cómo vender</Link>
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {listings.map((listing) => (
            <li key={listing.id}>
              <SellerListingRow listing={listing} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
