/**
 * @file page.tsx
 * @description Verification step: upload cédula front image.
 * @dependencies Verification upload components
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { CedulaFrontForm } from "@/features/verification/components/cedula-front-form";
import { VerificationShell } from "@/features/verification/components/verification-shell";
import { verificationLockedPath } from "@/features/verification/types";
import { getOrCreateDraftVerification } from "@/lib/auth/identity";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Cédula — frente",
};

/**
 * CedulaFrontPage
 *
 * Captures the front of the Colombian ID document.
 *
 * @returns Cédula front upload step.
 */
export default async function CedulaFrontPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/verificacion/cedula-frente");

  const draft = await getOrCreateDraftVerification(current.profile.id);
  const locked = verificationLockedPath(draft.status);
  if (locked) redirect(locked);
  if (!draft.privacyAcceptedAt) redirect("/verificacion");

  return (
    <AppShell mainClassName="max-w-lg">
      <VerificationShell step={2} title="Frente de tu cédula">
        <CedulaFrontForm />
      </VerificationShell>
    </AppShell>
  );
}
