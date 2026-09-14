/**
 * @file page.tsx
 * @description Staff queue for consumer PQR cases.
 * @dependencies auth session, pqr service, QueueTabs
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { QueueTabs } from "@/components/queue-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canAccessReviewPortal, getCurrentProfile } from "@/lib/auth/session";
import {
  countPqrCasesForStaff,
  listPqrCasesForStaff,
  pqrStatusLabel,
  pqrTipoLabel,
} from "@/lib/pqr/pqr-service";
import { PQR_QUEUE_TABS, parsePqrQueueTab } from "@/lib/pqr/pqr-queue";

export const metadata: Metadata = {
  title: "PQR",
  description: "Peticiones, quejas y reclamos radicados por consumidores.",
};

/**
 * PqrQueuePage
 *
 * Lists consumer PQR cases grouped by workflow status.
 *
 * @param props.searchParams - Queue tab query.
 * @returns Staff queue with tabs and empty state.
 */
export default async function PqrQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/pqr");
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

  const { tab: rawTab } = await searchParams;
  const tab = parsePqrQueueTab(rawTab);
  const [cases, counts] = await Promise.all([
    listPqrCasesForStaff(PQR_QUEUE_TABS[tab].statuses),
    countPqrCasesForStaff(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/revision">← Centro de revisión</Link>
        </Button>
        <h1 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
          PQR
        </h1>
        <p className="text-muted-foreground text-sm">
          Peticiones, quejas, reclamos y retracto radicados por consumidores.
          Responde con fundamento y conserva el radicado.
        </p>
      </div>

      <QueueTabs
        active={tab}
        ariaLabel="Estados de PQR"
        tabs={Object.entries(PQR_QUEUE_TABS).map(([id, item]) => ({
          id,
          label: item.label,
          href: `/revision/pqr?tab=${id}`,
          count: counts[id as keyof typeof counts],
        }))}
      />

      {cases.length === 0 ? (
        <EmptyState
          title={`No hay casos en ${PQR_QUEUE_TABS[tab].label.toLowerCase()}`}
          description="Cuando un consumidor radique un PQR con este estado aparecerá aquí."
          action={
            <Button asChild variant="outline">
              <Link href="/revision">Volver al centro</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {cases.map((pqrCase) => (
            <li key={pqrCase.id}>
              <Link
                href={`/revision/pqr/${pqrCase.id}`}
                className="border-border hover:bg-muted/50 block rounded-xl border p-4 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-foreground font-mono text-sm font-semibold">
                      {pqrCase.radicado}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {pqrCase.fullName} · {pqrCase.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <Badge variant="outline">
                      {pqrTipoLabel(pqrCase.tipo)}
                    </Badge>
                    <Badge variant="secondary">
                      {pqrStatusLabel(pqrCase.status)}
                    </Badge>
                  </div>
                </div>
                <p className="text-foreground mt-3 line-clamp-2 text-sm">
                  {pqrCase.body}
                </p>
                <div className="text-muted-foreground mt-3 flex flex-wrap justify-between gap-2 text-xs">
                  <span>
                    {pqrCase.assignedStaff
                      ? `Asignado a ${pqrCase.assignedStaff.fullName || pqrCase.assignedStaff.username || "equipo"}`
                      : "Sin asignar"}
                  </span>
                  <time dateTime={pqrCase.createdAt.toISOString()}>
                    {new Intl.DateTimeFormat("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(pqrCase.createdAt)}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
