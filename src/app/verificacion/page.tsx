/**
 * @file page.tsx
 * @description Identity verification flow entry page.
 * @dependencies Verification start components
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PrivacyAcceptForm } from "@/features/verification/components/privacy-accept-form";
import { VerificationShell } from "@/features/verification/components/verification-shell";
import { nextVerificationPath } from "@/features/verification/types";
import { getOrCreateDraftVerification } from "@/lib/auth/identity";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Verificación de identidad",
};

/**
 * VerificationStartPage
 *
 * Introduces and starts the seller identity verification flow.
 *
 * @returns Verification start page.
 */
export default async function VerificationStartPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/verificacion");

  if (current.profile.verifikStatus === "verified") {
    redirect("/vender");
  }

  const draft = await getOrCreateDraftVerification(current.profile.id);

  if (draft.status === "PENDING" || draft.status === "IN_REVIEW") {
    redirect("/verificacion/enviada");
  }

  if (draft.privacyAcceptedAt && draft.status === "DRAFT") {
    redirect(nextVerificationPath(draft));
  }

  return (
    <AppShell mainClassName="max-w-lg">
      <VerificationShell step={1} title="Tu privacidad primero">
        <PrivacyAcceptForm />
      </VerificationShell>
    </AppShell>
  );
}
