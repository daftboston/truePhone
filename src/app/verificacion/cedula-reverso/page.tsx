/**
 * @file page.tsx
 * @description Verification step: upload cédula back image.
 * @dependencies Verification upload components
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { CedulaBackForm } from "@/features/verification/components/cedula-back-form";
import { VerificationShell } from "@/features/verification/components/verification-shell";
import { verificationLockedPath } from "@/features/verification/types";
import { getOrCreateDraftVerification } from "@/lib/auth/identity";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Cédula — reverso",
};

/**
 * CedulaBackPage
 *
 * Captures the back of the Colombian ID document.
 *
 * @returns Cédula back upload step.
 */
export default async function CedulaBackPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/verificacion/cedula-reverso");

  const draft = await getOrCreateDraftVerification(current.profile.id);
  const locked = verificationLockedPath(draft.status);
  if (locked) redirect(locked);
  if (!draft.frontImageUrl) redirect("/verificacion/cedula-frente");

  return (
    <AppShell mainClassName="max-w-lg">
      <VerificationShell step={3} title="Reverso de tu cédula">
        <CedulaBackForm />
      </VerificationShell>
    </AppShell>
  );
}
