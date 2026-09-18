/**
 * @file page.tsx
 * @description Buyer availability-hold waiting page (F3).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { BuyerHoldWaiting } from "@/features/availability-hold/components/buyer-hold-waiting";
import { getHoldByIdForParticipant } from "@/lib/availability-hold";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Confirmación de disponibilidad",
  description: "Esperando confirmación del vendedor antes de pagar.",
};

type PageProps = {
  params: Promise<{ holdId: string }>;
};

export default async function BuyerAvailabilityHoldPage({ params }: PageProps) {
  const { holdId } = await params;
  const current = await getCurrentProfile();
  if (!current) redirect(`/login?next=/compras/disponibilidad/${holdId}`);

  const hold = await getHoldByIdForParticipant(holdId, current.profile.id);
  if (!hold || hold.buyerId !== current.profile.id) notFound();

  if (hold.orderId) {
    redirect(`/compras/${hold.orderId}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/compras">← Mis compras</Link>
      </Button>
      <BuyerHoldWaiting
        holdId={hold.id}
        status={hold.status}
        expiresAtIso={hold.expiresAt.toISOString()}
        unlockExpiresAtIso={hold.unlockExpiresAt?.toISOString() ?? null}
        listingTitle={hold.listing.title}
        listingSlug={hold.listing.slug}
      />
    </div>
  );
}
