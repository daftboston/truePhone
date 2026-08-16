/**
 * @file page.tsx
 * @description Password recovery request page.
 * @dependencies Auth recover form components
 */

import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { RecoverForm } from "@/features/auth/components/recover-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

/**
 * RecoverPage
 *
 * Renders the forgot-password email form.
 *
 * @returns Password recovery page.
 */
export default function RecoverPage() {
  return (
    <AuthShell
      title="Recupera tu contraseña"
      description="Te enviaremos un enlace para crear una nueva contraseña."
      footer={
        <>
          ¿Recordaste tu contraseña?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Iniciar sesión
          </Link>
        </>
      }
    >
      <RecoverForm />
    </AuthShell>
  );
}
