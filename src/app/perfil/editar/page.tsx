import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { AvatarUploadForm } from "@/features/profile/components/avatar-upload-form";
import { ProfileEditForm } from "@/features/profile/components/profile-edit-form";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Editar perfil",
};

export default async function EditProfilePage() {
  const current = await getCurrentProfile();
  if (!current) {
    return null;
  }

  const { profile } = current;

  return (
    <AppShell mainClassName="max-w-lg gap-6">
      <div className="space-y-2">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Editar perfil
        </h1>
        <p className="text-muted-foreground text-sm">
          Esta información ayuda a generar confianza con compradores y
          vendedores.
        </p>
      </div>

      <section className="border-border space-y-4 rounded-xl border p-4">
        <h2 className="text-foreground text-sm font-semibold">Foto</h2>
        <AvatarUploadForm
          fullName={profile.fullName}
          avatarUrl={profile.avatarUrl}
        />
      </section>

      <section className="border-border rounded-xl border p-4">
        <ProfileEditForm
          fullName={profile.fullName}
          username={profile.username}
          city={profile.city}
          department={profile.department}
          bio={profile.bio}
          phone={profile.phone}
        />
      </section>

      <Button variant="ghost" asChild>
        <Link href="/perfil">Cancelar</Link>
      </Button>
    </AppShell>
  );
}
