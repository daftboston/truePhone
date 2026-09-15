/**
 * @file page.tsx
 * @description Staff detail for one consumer PQR case.
 * @dependencies auth session, pqr service, PqrOpsPanel
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PqrOpsPanel } from "@/features/pqr/components/pqr-ops-panel";
import { canAccessReviewPortal, getCurrentProfile } from "@/lib/auth/session";
import {
  getPqrCaseForStaff,
  pqrStatusLabel,
  pqrTipoLabel,
} from "@/lib/pqr/pqr-service";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { caseId } = await params;
  const pqrCase = await getPqrCaseForStaff(caseId);
  return {
    title: pqrCase
      ? `PQR · ${pqrCase.radicado}`
      : `PQR · ${caseId.slice(0, 8)}`,
  };
}

/**
 * PqrCasePage
 *
 * Shows one PQR case with staff response controls.
 *
 * @param props.params - PqrCase route id.
 * @returns Staff-only PQR detail.
 */
export default async function PqrCasePage({ params }: PageProps) {
  const { caseId } = await params;
  const current = await getCurrentProfile();
  if (!current) redirect(`/login?next=/revision/pqr/${caseId}`);
  if (!canAccessReviewPortal(current.profile.role)) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden ver esta cola."
          action={
            <Button asChild variant="outline">
              <Link href="/perfil">Volver a Mi TruePhone</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const pqrCase = await getPqrCaseForStaff(caseId);
  if (!pqrCase) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/revision/pqr">← PQR</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
            {pqrCase.radicado}
          </h1>
          <Badge variant="outline">{pqrTipoLabel(pqrCase.tipo)}</Badge>
          <Badge variant="secondary">{pqrStatusLabel(pqrCase.status)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Caso {pqrCase.id}
          {pqrCase.orderId ? ` · Pedido ${pqrCase.orderId}` : null}
        </p>
      </div>

      <PqrOpsPanel pqrCase={pqrCase} currentStaffId={current.profile.id} />
    </div>
  );
}
