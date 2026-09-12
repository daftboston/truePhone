/**
 * @file page.tsx
 * @description Detail view for reviewing one identity verification.
 * @dependencies Identity claim action, signed storage URLs, review actions
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { claimIdentityForReviewAction } from "@/features/verification/actions/identity";
import { IdentityReviewActions } from "@/features/verification/components/identity-review-actions";
import {
  canDecideIdentityReview,
  findNextUnclaimedIdentityVerification,
  getIdentityVerificationForReview,
  identityReviewStatusBadgeVariant,
  identityReviewStatusLabel,
  identitySellerDisplayName,
} from "@/lib/auth/identity";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSignedStorageUrl } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ verificationId: string }>;
};

/**
 * IdentityDocFrame
 *
 * Large labeled identity photo for reviewer comparison.
 *
 * @param props.href - Signed URL, or null.
 * @param props.label - Frente, Reverso, or Selfie.
 * @param props.className - Optional layout class.
 * @returns Linked image or empty placeholder.
 * @calledBy IdentityReviewDetailPage
 */
function IdentityDocFrame({
  href,
  label,
  className,
}: {
  href: string | null;
  label: string;
  className?: string;
}) {
  if (!href) {
    return (
      <div
        className={`bg-muted text-muted-foreground flex min-h-48 items-center justify-center rounded-xl text-sm ${className ?? ""}`}
      >
        {label} no disponible
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`bg-muted relative block overflow-hidden rounded-xl ${className ?? ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- signed identity URLs */}
      <img
        src={href}
        alt={label}
        className="max-h-[28rem] w-full object-contain"
      />
      <span className="bg-background/80 text-foreground absolute inset-x-0 bottom-0 px-2 py-1 text-center text-xs font-medium">
        {label}
      </span>
    </a>
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { verificationId } = await params;
  return { title: `Identidad · ${verificationId.slice(0, 8)}` };
}

/**
 * IdentityReviewDetailPage
 *
 * Claims an unclaimed case on open and shows large document compare.
 *
 * @returns Identity review detail.
 */
export default async function IdentityReviewDetailPage({ params }: PageProps) {
  const { verificationId } = await params;
  const current = await getCurrentProfile();
  if (!current) {
    redirect(`/login?next=/revision/identidad/${verificationId}`);
  }

  if (current.profile.role !== "REVIEWER" && current.profile.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden revisar identidades."
          action={
            <Button asChild variant="outline">
              <Link href="/">Volver al inicio</Link>
            </Button>
          }
        />
      </div>
    );
  }

  let verification = await getIdentityVerificationForReview(verificationId);
  if (!verification) notFound();

  if (
    (verification.status === "PENDING" ||
      verification.status === "IN_REVIEW") &&
    !verification.reviewerId
  ) {
    await claimIdentityForReviewAction(verification.id);
    verification =
      (await getIdentityVerificationForReview(verificationId)) ?? verification;
  }

  const [frontImageUrl, backImageUrl, selfieImageUrl, nextId] =
    await Promise.all([
      createSignedStorageUrl(verification.frontImageUrl),
      createSignedStorageUrl(verification.backImageUrl),
      createSignedStorageUrl(verification.selfieImageUrl),
      findNextUnclaimedIdentityVerification(verification.id),
    ]);
  const docsAvailable = Boolean(
    frontImageUrl || backImageUrl || selfieImageUrl,
  );
  const canDecide = canDecideIdentityReview({
    status: verification.status,
    reviewerId: verification.reviewerId,
    actorId: current.profile.id,
    actorRole: current.profile.role,
  });
  const sellerName = identitySellerDisplayName(verification.profile);
  const assignedLabel = verification.reviewer
    ? `Asignado a ${identitySellerDisplayName(verification.reviewer)}`
    : null;
  const sellerHref = verification.profile.username
    ? `/u/${verification.profile.username}`
    : null;
  const isOpen =
    verification.status === "PENDING" || verification.status === "IN_REVIEW";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/revision/identidad">← Volver a la cola</Link>
        </Button>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          {sellerName}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={identityReviewStatusBadgeVariant(verification)}>
            {identityReviewStatusLabel(verification)}
          </Badge>
          {assignedLabel ? (
            <span className="text-muted-foreground text-xs">
              {assignedLabel}
            </span>
          ) : null}
        </div>
        {verification.documentNumberLast4 ? (
          <p className="text-muted-foreground text-sm">
            Cédula •••• {verification.documentNumberLast4}
          </p>
        ) : null}
        {sellerHref ? (
          <Link
            href={sellerHref}
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-2 hover:underline"
          >
            Ver perfil público
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-start">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <IdentityDocFrame href={frontImageUrl} label="Frente" />
            <IdentityDocFrame href={backImageUrl} label="Reverso" />
          </div>
          <IdentityDocFrame
            href={selfieImageUrl}
            label="Selfie"
            className="mx-auto max-w-md"
          />
        </div>

        <div className="lg:sticky lg:top-24">
          {isOpen ? (
            <IdentityReviewActions
              verificationId={verification.id}
              documentLast4={verification.documentNumberLast4}
              canApprove={canDecide && docsAvailable}
              canReject={canDecide}
              docsAvailable={docsAvailable}
              assignedLabel={assignedLabel}
              nextHref={nextId ? `/revision/identidad/${nextId}` : null}
            />
          ) : (
            <div className="border-border space-y-2 rounded-xl border p-4 text-sm">
              <p className="text-foreground font-semibold">
                Este caso ya tiene una decisión
              </p>
              {verification.rejectionReason ? (
                <p className="text-muted-foreground">
                  Motivo: {verification.rejectionReason}
                </p>
              ) : null}
              {nextId ? (
                <Button asChild fullWidth className="mt-2">
                  <Link href={`/revision/identidad/${nextId}`}>
                    Siguiente en la cola
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" fullWidth className="mt-2">
                  <Link href="/revision/identidad">Volver a la cola</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
