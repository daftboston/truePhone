import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Crea tu cuenta"
      description="Empieza a comprar y vender iPhones con Compra Garantizada."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Iniciar sesión
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
