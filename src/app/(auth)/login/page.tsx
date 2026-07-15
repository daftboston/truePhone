import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeNextPath } from "@/features/auth/types";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const callbackError =
    params.error === "auth_callback"
      ? "No pudimos completar el inicio de sesión. Intenta de nuevo."
      : null;

  return (
    <AuthShell
      title="Inicia sesión"
      description="Accede a tu cuenta para vender, comprar y gestionar tus pedidos."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="text-primary font-medium hover:underline"
          >
            Crear cuenta
          </Link>
        </>
      }
    >
      {callbackError ? (
        <p className="text-destructive mb-4 text-sm" role="alert">
          {callbackError}
        </p>
      ) : null}
      <LoginForm next={next === "/" ? undefined : next} />
    </AuthShell>
  );
}
