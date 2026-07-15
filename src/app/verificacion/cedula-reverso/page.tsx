import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { CedulaBackForm } from "@/features/verification/components/cedula-back-form";
import { VerificationShell } from "@/features/verification/components/verification-shell";
import { getOrCreateDraftVerification } from "@/lib/auth/identity";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Cédula — reverso",
};

export default async function CedulaBackPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/verificacion/cedula-reverso");

  const draft = await getOrCreateDraftVerification(current.profile.id);
  if (draft.status === "PENDING" || draft.status === "VERIFIED") {
    redirect(draft.status === "VERIFIED" ? "/vender" : "/verificacion/enviada");
  }
  if (!draft.frontImageUrl) redirect("/verificacion/cedula-frente");

  return (
    <AppShell mainClassName="max-w-lg">
      <VerificationShell step={3} title="Reverso de tu cédula">
        <CedulaBackForm />
      </VerificationShell>
    </AppShell>
  );
}
