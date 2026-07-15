import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { CedulaFrontForm } from "@/features/verification/components/cedula-front-form";
import { VerificationShell } from "@/features/verification/components/verification-shell";
import { getOrCreateDraftVerification } from "@/lib/auth/identity";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Cédula — frente",
};

export default async function CedulaFrontPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/verificacion/cedula-frente");

  const draft = await getOrCreateDraftVerification(current.profile.id);
  if (draft.status === "PENDING" || draft.status === "VERIFIED") {
    redirect(draft.status === "VERIFIED" ? "/vender" : "/verificacion/enviada");
  }
  if (!draft.privacyAcceptedAt) redirect("/verificacion");

  return (
    <AppShell mainClassName="max-w-lg">
      <VerificationShell step={2} title="Frente de tu cédula">
        <CedulaFrontForm />
      </VerificationShell>
    </AppShell>
  );
}
