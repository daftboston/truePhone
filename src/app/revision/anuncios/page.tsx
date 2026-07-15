import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Cola de anuncios",
};

export default async function ListingReviewPlaceholderPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/anuncios");

  if (current.profile.role !== "REVIEWER" && current.profile.role !== "ADMIN") {
    return (
      <AppShell mainClassName="max-w-lg justify-center">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden ver esta cola."
          action={
            <Button asChild variant="outline">
              <Link href="/">Volver al inicio</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell mainClassName="max-w-lg justify-center">
      <EmptyState
        title="Cola de anuncios — próxima fase"
        description="Los anuncios en PENDING_REVIEW ya se guardan. La UI de aprobación/rechazo es la Fase 6."
        action={
          <Button asChild>
            <Link href="/revision/identidad">Ir a cola de identidad</Link>
          </Button>
        }
      />
    </AppShell>
  );
}
