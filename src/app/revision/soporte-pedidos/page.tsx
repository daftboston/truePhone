/**
 * @file page.tsx
 * @description Request-backed staff queue for seller order-support cases.
 * @dependencies next/link, auth session, order-support service, shared UI
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { OrderSupportCaseStatus } from "@prisma/client";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canAccessReviewPortal, getCurrentProfile } from "@/lib/auth/session";
import { listOrderSupportCasesForStaff } from "@/lib/orders/order-support-service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Soporte de pedidos",
  description: "Solicitudes de vendedores revisadas por operaciones TruePhone.",
};

const TABS = {
  pendientes: {
    label: "Pendientes",
    statuses: ["PENDING"],
  },
  revision: {
    label: "En revisión",
    statuses: ["IN_REVIEW"],
  },
  vendedor: {
    label: "Esperando vendedor",
    statuses: ["NEEDS_SELLER_RESPONSE"],
  },
  escaladas: {
    label: "Escaladas",
    statuses: ["ESCALATED"],
  },
  resueltas: {
    label: "Resueltas",
    statuses: ["APPROVED", "REJECTED", "RESOLVED", "WITHDRAWN"],
  },
} satisfies Record<
  string,
  { label: string; statuses: OrderSupportCaseStatus[] }
>;

type QueueTab = keyof typeof TABS;

/**
 * normalizeQueueTab
 *
 * Resolves a supported query tab and falls back to pending work.
 *
 * @param value - Raw `tab` query value.
 * @returns Valid queue tab key.
 * @calledBy OrderSupportQueuePage
 */
function normalizeQueueTab(value: string | undefined): QueueTab {
  return value && value in TABS ? (value as QueueTab) : "pendientes";
}

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
  if (!canAccessReviewPortal(current.profile.role)) redirect("/perfil");

  const { tab: rawTab } = await searchParams;
  const tab = normalizeQueueTab(rawTab);
  const cases = await listOrderSupportCasesForStaff(TABS[tab].statuses);

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

      <nav
        aria-label="Estados de soporte"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {Object.entries(TABS).map(([key, item]) => (
          <Link
            key={key}
            href={`/revision/soporte-pedidos?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
              tab === key
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-foreground hover:bg-muted",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {cases.length === 0 ? (
        <EmptyState
          title={`No hay casos en ${TABS[tab].label.toLowerCase()}`}
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
                  <Badge variant="outline">
                    {caseTypeLabel(supportCase.type)}
                  </Badge>
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
