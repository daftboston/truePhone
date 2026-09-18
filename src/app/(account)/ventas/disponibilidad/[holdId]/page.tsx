/**
 * @file page.tsx
 * @description Seller availability-hold response page (F3).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SellerHoldResponse } from "@/features/availability-hold/components/seller-hold-response";
import {
  getHoldByIdForParticipant,
  holdStatusLabel,
} from "@/lib/availability-hold";
import { getCurrentProfile } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Confirmar disponibilidad",
  description: "Responde si el iPhone sigue disponible antes del pago.",
};

type PageProps = {
  params: Promise<{ holdId: string }>;
};

export default async function SellerAvailabilityHoldPage({
  params,
}: PageProps) {
  const { holdId } = await params;
  const current = await getCurrentProfile();
  if (!current) redirect(`/login?next=/ventas/disponibilidad/${holdId}`);

  const hold = await getHoldByIdForParticipant(holdId, current.profile.id);
  if (!hold || hold.listing.sellerId !== current.profile.id) notFound();

  const buyerName =
    hold.buyer.fullName?.trim() || hold.buyer.username || "Comprador";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/ventas">← Mis ventas</Link>
      </Button>
      <div className="space-y-2">
        <Badge variant="secondary">{holdStatusLabel(hold.status)}</Badge>
        <h1 className="text-foreground text-xl font-semibold">
          Confirmar disponibilidad
        </h1>
      </div>
      {hold.status === "PENDING" ? (
        <SellerHoldResponse
          holdId={hold.id}
          listingTitle={hold.listing.title}
          buyerName={buyerName}
          expiresAtIso={hold.expiresAt.toISOString()}
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          Esta solicitud ya fue respondida (
          {holdStatusLabel(hold.status).toLowerCase()}).
        </p>
      )}
    </div>
  );
}
