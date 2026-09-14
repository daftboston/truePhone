/**
 * @file page.tsx
 * @description Request-backed staff queue for seller order-support cases.
 * @dependencies next/link, auth session, order-support service, QueueTabs
 * @changelog 2026-09-11 — QueueTabs with counts; EmptyState on deny.
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
  ORDER_SUPPORT_QUEUE_TABS,
  parseOrderSupportQueueTab,
} from "@/lib/orders/order-support-queue";
import {
  countOrderSupportCasesForStaff,
  listOrderSupportCasesForStaff,
  orderSupportStatusLabel,
} from "@/lib/orders/order-support-service";

export const metadata: Metadata = {
  title: "Soporte de pedidos",
  description:
    "Solicitudes de vendedores revisadas por el equipo de TruePhone.",
};

/**
 * caseTypeLabel
 *
 * Maps support case type to staff-facing Spanish.
 *
 * @param type - Persisted case type.
 * @returns Queue label.
 * @calledBy OrderSupportQueuePage
 */
function caseTypeLabel(type: string) {
  if (type === "SELLER_CANCELLATION") return "Cancelación";
  if (type === "FULFILLMENT_EXCEPTION") return "Problema de envío";
  return "Soporte general";
}

/**
 * OrderSupportQueuePage
 *
 * Shows only submitted support cases grouped by workflow status.
 *
 * @param props.searchParams - Queue tab query.
 * @returns Staff queue with consistent tabs and empty state.
 */
export default async function OrderSupportQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/soporte-pedidos");
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
  const tab = parseOrderSupportQueueTab(rawTab);
  const [cases, counts] = await Promise.all([
    listOrderSupportCasesForStaff(ORDER_SUPPORT_QUEUE_TABS[tab].statuses),
    countOrderSupportCasesForStaff(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/revision">← Centro de revisión</Link>
        </Button>
        <h1 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
          Soporte de pedidos
        </h1>
        <p className="text-muted-foreground text-sm">
          Solo aparecen solicitudes enviadas por vendedores. Asigna cada caso
          antes de responder o decidir.
        </p>
      </div>

      <QueueTabs
        active={tab}
        ariaLabel="Estados de soporte"
        tabs={Object.entries(ORDER_SUPPORT_QUEUE_TABS).map(([id, item]) => ({
          id,
          label: item.label,
          href: `/revision/soporte-pedidos?tab=${id}`,
          count: counts[id as keyof typeof counts],
        }))}
      />

      {cases.length === 0 ? (
        <EmptyState
          title={`No hay casos en ${ORDER_SUPPORT_QUEUE_TABS[tab].label.toLowerCase()}`}
          description="Cuando un vendedor envíe una solicitud con este estado aparecerá aquí."
          action={
            <Button asChild variant="outline">
              <Link href="/revision">Volver al centro</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {cases.map((supportCase) => (
            <li key={supportCase.id}>
              <Link
                href={`/revision/soporte-pedidos/${supportCase.id}`}
                className="border-border hover:bg-muted/50 block rounded-xl border p-4 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-foreground text-sm font-semibold">
                      {supportCase.order.listing.title}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {supportCase.seller.fullName ||
                        supportCase.seller.username ||
                        "Vendedor"}{" "}
                      · Pedido {supportCase.orderId.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <Badge variant="outline">
                      {caseTypeLabel(supportCase.type)}
                    </Badge>
                    <Badge variant="secondary">
                      {orderSupportStatusLabel(supportCase.status)}
                    </Badge>
                  </div>
                </div>
                <p className="text-foreground mt-3 line-clamp-2 text-sm">
                  {supportCase.initialReason}
                </p>
                <div className="text-muted-foreground mt-3 flex flex-wrap justify-between gap-2 text-xs">
                  <span>
                    {supportCase.assignedStaff
                      ? `Asignada a ${supportCase.assignedStaff.fullName || supportCase.assignedStaff.username || "equipo"}`
                      : "Sin asignar"}
                  </span>
                  <time dateTime={supportCase.createdAt.toISOString()}>
                    {new Intl.DateTimeFormat("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(supportCase.createdAt)}
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
