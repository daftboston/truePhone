/**
 * @file page.tsx
 * @description Queue of identity verifications awaiting manual review.
 * @dependencies Identity review loaders and actions
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { IdentityReviewActions } from "@/features/verification/components/identity-review-actions";
import { listPendingIdentityVerifications } from "@/lib/auth/identity";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSignedStorageUrl } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Revisión de identidad",
};

/**
 * IdentityReviewQueuePage
 *
 * Lists pending identity verification submissions for staff.
 *
 * @returns Identity review queue.
 */
export default async function IdentityReviewQueuePage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/identidad");

  if (current.profile.role !== "REVIEWER" && current.profile.role !== "ADMIN") {
    return (
      <AppShell mainClassName="max-w-lg justify-center">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden ver esta cola. Usa supabase/promote-reviewer.sql para asignar el rol."
          action={
            <Button asChild variant="outline">
              <Link href="/">Volver al inicio</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const pending = await listPendingIdentityVerifications();

  // Mark PENDING items as IN_REVIEW when a reviewer opens the queue.
  const pendingIds = pending
    .filter((item) => item.status === "PENDING")
    .map((item) => item.id);
  if (pendingIds.length > 0) {
    await prisma.identityVerification.updateMany({
      where: { id: { in: pendingIds } },
      data: { status: "IN_REVIEW" },
    });
  }

  const withDocs = await Promise.all(
    pending.map(async (item) => {
      const [frontImageUrl, backImageUrl, selfieImageUrl] = await Promise.all([
        createSignedStorageUrl(item.frontImageUrl),
        createSignedStorageUrl(item.backImageUrl),
        createSignedStorageUrl(item.selfieImageUrl),
      ]);
      const docsAvailable = Boolean(
        frontImageUrl || backImageUrl || selfieImageUrl,
      );
      return {
        item,
        frontImageUrl,
        backImageUrl,
        selfieImageUrl,
        docsAvailable,
      };
    }),
  );

  return (
    <AppShell mainClassName="max-w-lg gap-6">
      <div className="space-y-2">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Cola de identidad
        </h1>
        <p className="text-muted-foreground text-sm">
          Aprueba o rechaza verificaciones de cédula y selfie.
        </p>
      </div>

      {withDocs.length === 0 ? (
        <EmptyState
          title="No hay pendientes"
          description="Cuando un vendedor envíe su cédula, aparecerá aquí."
        />
      ) : (
        <div className="space-y-4">
          {withDocs.map(
            ({
              item,
              frontImageUrl,
              backImageUrl,
              selfieImageUrl,
              docsAvailable,
            }) => (
              <IdentityReviewActions
                key={item.id}
                verificationId={item.id}
                documentLast4={item.documentNumberLast4}
                sellerName={
                  item.profile.fullName ??
                  (item.profile.username
                    ? `@${item.profile.username}`
                    : "Vendedor")
                }
                frontImageUrl={frontImageUrl}
                backImageUrl={backImageUrl}
                selfieImageUrl={selfieImageUrl}
                docsAvailable={docsAvailable}
              />
            ),
          )}
        </div>
      )}
    </AppShell>
  );
}
