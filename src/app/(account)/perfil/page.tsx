import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AvatarUploadForm } from "@/features/profile/components/avatar-upload-form";
import { ChangePasswordForm } from "@/features/profile/components/change-password-form";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ShareProfileButton } from "@/features/profile/components/share-profile-button";
import { publicProfilePath } from "@/features/profile/types";
import {
  isSellerIdentityVerified,
  nextVerificationPath,
  verificationStatusLabel,
} from "@/features/verification/types";
import { getLatestIdentityVerification } from "@/lib/auth/identity";
import {
  canAccessReviewPortal,
  requireCurrentProfile,
  roleLabel,
} from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Perfil",
};

export default async function ProfilePage() {
  const current = await requireCurrentProfile("/perfil");

  const { user, profile } = current;
  const sharePath = publicProfilePath(profile.username);
  const verification = await getLatestIdentityVerification(profile.id);
  const verified = isSellerIdentityVerified(profile.verifikStatus);
  const verificationHref = verified
    ? "/vender"
    : profile.verifikStatus === "pending"
      ? "/verificacion/enviada"
      : verification
        ? nextVerificationPath(verification)
        : "/verificacion";

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Resumen
        </h1>
        <p className="text-muted-foreground text-sm">
          Tu cuenta y estado en TruePhone.
        </p>
      </div>

      <ProfileHeader
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
      />

      <section className="border-border space-y-3 rounded-xl border p-4">
        <div className="flex items-start justify-between gap-3">
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
                ? "Listo para vender"
                : profile.verifikStatus === "pending"
                  ? "Ver estado"
                  : "Verificar"}
            </Link>
          </Button>
        </div>
      </section>

      {canAccessReviewPortal(profile.role) ? (
        <section className="border-border space-y-3 rounded-xl border p-4">
          <div>
            <h2 className="text-foreground text-sm font-semibold">
              Centro de revisión
            </h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Acceso de {roleLabel(profile.role)} a las colas de confianza.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/revision/anuncios">Cola de anuncios</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/revision/identidad">Cola de identidad</Link>
            </Button>
          </div>
        </section>
      ) : null}

      <section className="border-border space-y-4 rounded-xl border p-4">
        <h2 className="text-foreground text-sm font-semibold">
          Foto de perfil
        </h2>
        <AvatarUploadForm
          fullName={profile.fullName}
          avatarUrl={profile.avatarUrl}
        />
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {sharePath ? (
          <ShareProfileButton
            path={sharePath}
            title={profile.fullName ?? `@${profile.username}`}
          />
        ) : (
          <p className="text-muted-foreground self-center text-sm">
            Elige un usuario público para compartir tu perfil.
          </p>
        )}
        {sharePath ? (
          <Button variant="ghost" asChild>
            <Link href={sharePath}>Ver perfil público</Link>
          </Button>
        ) : null}
      </section>

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

      <section className="border-border space-y-4 rounded-xl border p-4">
        <div>
          <h2 className="text-foreground text-sm font-semibold">
            Cambiar contraseña
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Usa una contraseña de al menos 8 caracteres.
          </p>
        </div>
        <ChangePasswordForm />
      </section>
    </>
  );
}
