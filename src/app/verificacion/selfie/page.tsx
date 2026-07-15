import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SelfieForm } from "@/features/verification/components/selfie-form";
import { VerificationShell } from "@/features/verification/components/verification-shell";
import { getOrCreateDraftVerification } from "@/lib/auth/identity";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Selfie de verificación",
};

export default async function SelfiePage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/verificacion/selfie");

  const draft = await getOrCreateDraftVerification(current.profile.id);
  if (draft.status === "PENDING" || draft.status === "VERIFIED") {
    redirect(draft.status === "VERIFIED" ? "/vender" : "/verificacion/enviada");
  }
  if (!draft.backImageUrl) redirect("/verificacion/cedula-reverso");

  return (
    <AppShell mainClassName="max-w-lg">
      <VerificationShell step={4} title="Confirma tu rostro">
        <SelfieForm />
      </VerificationShell>
    </AppShell>
  );
}
