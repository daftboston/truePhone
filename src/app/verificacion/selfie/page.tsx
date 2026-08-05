/**
 * @file page.tsx
 * @description Verification step: upload selfie for identity matching.
 * @dependencies Verification upload components
 */

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

/**
 * SelfiePage
 *
 * Captures the seller selfie used in identity review.
 *
 * @returns Selfie upload step.
 */
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
