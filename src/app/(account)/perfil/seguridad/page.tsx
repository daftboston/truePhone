/**
 * @file page.tsx
 * @description Account password page (moved off the Perfil hub).
 * @dependencies ChangePasswordForm, requireCurrentProfile
 */

import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ChangePasswordForm } from "@/features/profile/components/change-password-form";
import { requireCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Contraseña",
};

/**
 * ProfileSecurityPage
 *
 * Renders the logged-in password change form in the account shell.
 *
 * @returns Password settings page.
 */
export default async function ProfileSecurityPage() {
  await requireCurrentProfile("/perfil/seguridad");

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Contraseña
        </h1>
        <p className="text-muted-foreground text-sm">
          Usa una contraseña de al menos 8 caracteres.
        </p>
      </div>

      <section className="border-border rounded-xl border p-4">
        <ChangePasswordForm />
      </section>

      <Button variant="ghost" asChild>
        <Link href="/perfil">Volver al perfil</Link>
      </Button>
    </>
  );
}
