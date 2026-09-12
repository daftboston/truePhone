/**
 * @file page.tsx
 * @description Account profile hub: identity status and shortcuts (no inline forms).
 * @dependencies Profile helpers and account components
 * @changelog 2026-09-11 — ProfileHeader name is h2 so Perfil stays the page h1.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ShareProfileButton } from "@/features/profile/components/share-profile-button";
import { publicProfilePath } from "@/features/profile/types";
import {
  isSellerIdentityVerified,
  verificationNavHref,
  verificationStatusLabel,
} from "@/features/verification/types";
import { getLatestIdentityVerification } from "@/lib/auth/identity";
import {
  canAccessReviewPortal,
  requireCurrentProfile,
  roleLabel,
} from "@/lib/auth/session";
import { getPublicActivityCounts } from "@/lib/profile-activity";

export const metadata: Metadata = {
  title: "Perfil",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * hubBannerMessage
 *
 * Maps success query flags to a short next-action banner.
 *
 * @param params - Route search params.
 * @returns Spanish status copy, or null.
 * @calledBy ProfilePage
 */
function hubBannerMessage(
  params: Record<string, string | string[] | undefined>,
) {
  if (params.contrasena === "ok") {
    return "Tu contraseña ha sido actualizada.";
  }
  if (params.guardado === "1") {
    return "Cambios guardados.";
  }
  return null;
}

/**
 * ProfilePage
 *
 * Shows the signed-in user's public snapshot and account shortcuts.
 *
 * @param props.searchParams - Optional `guardado` / `contrasena` success flags.
 * @returns Profile hub page.
 */
export default async function ProfilePage({ searchParams }: PageProps) {
  const current = await requireCurrentProfile("/perfil");
  const params = await searchParams;
  const banner = hubBannerMessage(params);

  const { user, profile } = current;
  const sharePath = publicProfilePath(profile.username);
  const [verification, activity] = await Promise.all([
    getLatestIdentityVerification(profile.id),
    getPublicActivityCounts(profile.id),
  ]);
  const verified = isSellerIdentityVerified(profile.verifikStatus);
  const verificationHref = verificationNavHref({
    verifikStatus: profile.verifikStatus,
    verification,
  });

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Perfil
        </h1>
        <p className="text-muted-foreground text-sm">
          Datos públicos, verificación y seguridad de la cuenta.
        </p>
      </div>

      {banner ? (
        <p
          className="border-trust/30 bg-trust/10 text-foreground rounded-xl border px-3 py-2 text-sm"
          role="status"
        >
          {banner}
        </p>
      ) : null}

      <ProfileHeader
        headingLevel="h2"
        fullName={profile.fullName}
        username={profile.username}
        avatarUrl={profile.avatarUrl}
        bio={profile.bio}
        city={profile.city}
        department={profile.department}
        sellerRating={profile.sellerRating}
        totalSales={profile.totalSales}
        totalReviews={profile.totalReviews}
        isTrustedSeller={profile.isTrustedSeller}
        verifikStatus={profile.verifikStatus}
        createdAt={profile.createdAt}
        activity={activity}
      />

      <section className="border-border space-y-3 rounded-xl border p-4">
        <div>
          <h2 className="text-foreground text-sm font-semibold">
            Verificación de identidad
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Estado: {verificationStatusLabel(profile.verifikStatus)}
          </p>
        </div>
        <Button asChild size="sm" variant={verified ? "outline" : "default"}>
          <Link href={verificationHref}>
            {verified
              ? "Ver estado"
              : profile.verifikStatus === "pending"
                ? "Ver estado"
                : "Verificar"}
          </Link>
        </Button>
      </section>

      <nav aria-label="Atajos de cuenta" className="space-y-2">
        <HubLink href="/perfil/editar" label="Editar datos" />
        <HubLink href="/perfil/seguridad" label="Contraseña" />
        <HubLink href={verificationHref} label="Verificación" />
        {sharePath ? (
          <HubLink href={sharePath} label="Ver perfil público" />
        ) : (
          <p className="text-muted-foreground px-1 text-sm">
            Elige un usuario público para compartir tu perfil.
          </p>
        )}
      </nav>

      {sharePath ? (
        <ShareProfileButton
          path={sharePath}
          title={profile.fullName ?? `@${profile.username}`}
        />
      ) : null}

      {canAccessReviewPortal(profile.role) ? (
        <Button asChild variant="outline">
          <Link href="/revision">Centro de revisión</Link>
        </Button>
      ) : null}

      <section className="border-border space-y-3 rounded-xl border p-4">
        <h2 className="text-foreground text-sm font-semibold">Cuenta</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Correo</dt>
            <dd className="text-foreground text-right">{user.email ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Rol</dt>
            <dd className="text-foreground">{roleLabel(profile.role)}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}

/**
 * HubLink
 *
 * Compact chevron row linking to an account destination.
 *
 * @param props.href - Destination path.
 * @param props.label - Visible Spanish label.
 * @returns Linked row.
 * @calledBy ProfilePage
 */
function HubLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="border-border bg-card hover:bg-muted/60 focus-visible:ring-ring flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {label}
      <ChevronRight
        className="text-muted-foreground size-4 shrink-0"
        aria-hidden
      />
    </Link>
  );
}
