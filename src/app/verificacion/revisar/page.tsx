import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ReviewSubmitForm } from "@/features/verification/components/review-submit-form";
import { VerificationShell } from "@/features/verification/components/verification-shell";
import { getOrCreateDraftVerification } from "@/lib/auth/identity";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Revisar verificación",
};

export default async function ReviewVerificationPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/verificacion/revisar");

  const draft = await getOrCreateDraftVerification(current.profile.id);
  if (draft.status === "PENDING" || draft.status === "VERIFIED") {
    redirect(draft.status === "VERIFIED" ? "/vender" : "/verificacion/enviada");
  }
  if (!draft.selfieImageUrl) redirect("/verificacion/selfie");

  return (
    <AppShell mainClassName="max-w-lg">
      <VerificationShell step={5} title="Revisa y envía">
        <ReviewSubmitForm
          documentLast4={draft.documentNumberLast4}
          hasFront={Boolean(draft.frontImageUrl)}
          hasBack={Boolean(draft.backImageUrl)}
          hasSelfie={Boolean(draft.selfieImageUrl)}
        />
      </VerificationShell>
    </AppShell>
  );
}
