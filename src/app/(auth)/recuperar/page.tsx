import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { RecoverForm } from "@/features/auth/components/recover-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

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
