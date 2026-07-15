import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";
import { getAuthUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Nueva contraseña",
};

export default async function UpdatePasswordPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/recuperar");
  }

  return (
    <AuthShell
      title="Nueva contraseña"
      description="Elige una contraseña segura de al menos 8 caracteres."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
