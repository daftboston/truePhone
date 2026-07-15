import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { getLatestIdentityVerification } from "@/lib/auth/identity";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Verificación enviada",
};

export default async function VerificationSubmittedPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/verificacion/enviada");

  if (current.profile.verifikStatus === "verified") {
    redirect("/vender");
  }

  const latest = await getLatestIdentityVerification(current.profile.id);
  if (
    !latest ||
    (latest.status !== "PENDING" && latest.status !== "IN_REVIEW")
  ) {
    redirect("/verificacion");
  }

  return (
    <AppShell mainClassName="max-w-lg justify-center">
      <EmptyState
        title="Recibimos tu verificación"
        description="Un revisor de TruePhone confirmará tu identidad. Te avisaremos cuando puedas publicar anuncios."
        action={
          <Button asChild>
            <Link href="/perfil">Ir a tu perfil</Link>
          </Button>
        }
      />
    </AppShell>
  );
}
