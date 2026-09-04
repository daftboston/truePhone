/**
 * @file page.tsx
 * @description Ops-only marketplace analytics dashboard (Phase 15).
 * @dependencies Review portal access, ops-analytics aggregates, Card primitives
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  canAccessReviewPortal,
  getCurrentProfile,
  roleLabel,
} from "@/lib/auth/session";
import { formatOrderMoney } from "@/lib/format-money";
import { publicListingPath } from "@/lib/listings-marketplace";
import { loadOpsAnalytics } from "@/lib/ops-analytics";

export const metadata: Metadata = {
  title: "Analítica",
  description: "Métricas de operaciones del marketplace TruePhone.",
};

/**
 * formatReviewHours
 *
 * Formats median review latency for the ops dashboard.
 *
 * @param hours - Median hours, or null when no sample exists.
 * @returns Spanish duration label.
 * @calledBy OpsAnalyticsPage
 */
function formatReviewHours(hours: number | null) {
  if (hours == null) return "—";
  if (hours < 24) return `${Math.round(hours)} h`;
  return `${(hours / 24).toFixed(1).replace(".", ",")} días`;
}

/**
 * formatPercent
 *
 * Formats a nullable percent for dashboard tiles.
 *
 * @param value - Percent, or null.
 * @returns Display string.
 * @calledBy OpsAnalyticsPage
 */
function formatPercent(value: number | null) {
  if (value == null) return "—";
  return `${value}%`;
}

/**
 * listingStatusLabel
 *
 * Maps listing status enums to short Spanish labels.
 *
 * @param status - ListingStatus string.
 * @returns Ops-facing label.
 * @calledBy OpsAnalyticsPage
 */
function listingStatusLabel(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "Publicado";
    case "RESERVED":
      return "Reservado";
    case "SOLD":
      return "Vendido";
    default:
      return status;
  }
}

type StatCardProps = {
  title: string;
  value: string;
  hint: string;
};

/**
 * StatCard
 *
 * One metric tile on the ops analytics dashboard.
 *
 * @param props.title - Metric name.
 * @param props.value - Formatted primary value.
 * @param props.hint - Supporting copy.
 * @returns Card tile.
 * @calledBy OpsAnalyticsPage
 */
function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs leading-relaxed">{hint}</p>
      </CardContent>
    </Card>
  );
}

/**
 * OpsAnalyticsPage
 *
 * REVIEWER/ADMIN dashboard for GMV, queues, listing views, and popular models.
 * View counts stay off public profiles and order party cards.
 *
 * @returns Analytics dashboard or an access-restricted empty state.
 */
export default async function OpsAnalyticsPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/analitica");

  if (!canAccessReviewPortal(current.profile.role)) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden ver la analítica de operaciones."
          action={
            <Button asChild variant="outline">
              <Link href="/perfil">Volver a Mi TruePhone</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const stats = await loadOpsAnalytics();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
            Analítica
          </h1>
          <Badge variant="outline">{roleLabel(current.profile.role)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Solo el equipo de operaciones. Las vistas no aparecen en perfiles
          públicos ni en las tarjetas de pedido.
        </p>
      </div>

      <section
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Resumen"
      >
        <StatCard
          title="GMV liquidado"
          value={formatOrderMoney(stats.settledGmvPesos)}
          hint={`${stats.settledOrderCount} pedido${stats.settledOrderCount === 1 ? "" : "s"} con desembolso completado.`}
        />
        <StatCard
          title="Comisión cobrada"
          value={formatOrderMoney(stats.settledFeePesos)}
          hint="Suma de la tarifa de marketplace en pedidos liquidados."
        />
        <StatCard
          title="Vistas de anuncios"
          value={stats.listingViewCount.toLocaleString("es-CO")}
          hint="Visitantes únicos por anuncio y por día. Sin el vendedor ni crawlers."
        />
        <StatCard
          title="Vistas → liquidado"
          value={formatPercent(stats.viewsToCompletedPercent)}
          hint={`${stats.paidOrderCount} pedido${stats.paidOrderCount === 1 ? "" : "s"} aún en custodia.`}
        />
        <StatCard
          title="Tasa de aprobación"
          value={formatPercent(stats.approvalRatePercent)}
          hint="Publicados frente a rechazados en la cola de anuncios."
        />
        <StatCard
          title="Tiempo de revisión"
          value={formatReviewHours(stats.medianReviewHours)}
          hint="Mediana desde la creación del anuncio hasta la decisión."
        />
        <StatCard
          title="Cuentas nuevas"
          value={`${stats.profilesLast7Days} / ${stats.profilesLast30Days}`}
          hint="Perfiles creados en 7 días / 30 días."
        />
        <StatCard
          title="Vendedores (30 días)"
          value={stats.sellersLast30Days.toLocaleString("es-CO")}
          hint="Vendedores que crearon al menos un anuncio en 30 días."
        />
      </section>

      <section className="space-y-3" aria-label="Inventario">
        <h2 className="text-foreground text-sm font-semibold">Anuncios</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Publicados"
            value={String(stats.listingStatusCounts.published)}
            hint="Visibles en el marketplace."
          />
          <StatCard
            title="Reservados"
            value={String(stats.listingStatusCounts.reserved)}
            hint="Con pedido activo."
          />
          <StatCard
            title="Vendidos"
            value={String(stats.listingStatusCounts.sold)}
            hint="Venta cerrada."
          />
          <StatCard
            title="En cola"
            value={String(stats.listingStatusCounts.pendingReview)}
            hint="Enviados o en revisión."
          />
          <StatCard
            title="Rechazados"
            value={String(stats.listingStatusCounts.rejected)}
            hint="Pendientes de corrección del vendedor."
          />
        </div>
      </section>

      <section className="space-y-3" aria-label="Salud de colas">
        <h2 className="text-foreground text-sm font-semibold">
          Salud de colas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Anuncios pendientes"
            value={String(stats.queue.listingsPending)}
            hint={`${stats.queue.listingsInReview} ya reclamados.`}
          />
          <StatCard
            title="Identidad"
            value={String(stats.queue.identityPending)}
            hint="Cédula y selfie por revisar."
          />
          <StatCard
            title="Soporte de pedidos"
            value={String(stats.queue.orderSupport)}
            hint="Casos accionables de vendedores."
          />
          <StatCard
            title="Reportes"
            value={String(
              stats.queue.questionReports + stats.queue.reviewReports,
            )}
            hint={`${stats.queue.questionReports} preguntas · ${stats.queue.reviewReports} reseñas.`}
          />
          <StatCard
            title="Liquidaciones"
            value={String(stats.queue.payoutsAuthorized)}
            hint="Autorizadas, pendientes de pago en Wompi."
          />
          <StatCard
            title="Disputas"
            value={String(stats.queue.disputesFrozen)}
            hint="Pagos congelados."
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2" aria-label="Detalle">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anuncios más vistos</CardTitle>
            <CardDescription>
              Conteos privados para operaciones. No se muestran al público.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topViewed.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aún no hay vistas registradas.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {stats.topViewed.map((listing) => (
                  <li
                    key={listing.id}
                    className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={publicListingPath(listing.slug)}
                        className="text-foreground text-sm font-medium hover:underline"
                      >
                        {listing.title}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {listingStatusLabel(listing.status)}
                      </p>
                    </div>
                    <p className="text-foreground shrink-0 text-sm font-semibold tabular-nums">
                      {listing.views.toLocaleString("es-CO")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modelos populares</CardTitle>
            <CardDescription>
              Publicados ahora y modelos en pedidos ya liquidados.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-foreground mb-2 text-xs font-semibold">
                En vitrina
              </p>
              {stats.popularPublishedModels.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sin anuncios.</p>
              ) : (
                <ul className="space-y-1.5">
                  {stats.popularPublishedModels.map((row) => (
                    <li
                      key={row.name}
                      className="flex justify-between gap-2 text-sm"
                    >
                      <span className="text-foreground min-w-0 truncate">
                        {row.name}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {row.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-foreground mb-2 text-xs font-semibold">
                Vendidos
              </p>
              {stats.popularSoldModels.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Aún no hay liquidaciones.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {stats.popularSoldModels.map((row) => (
                    <li
                      key={row.name}
                      className="flex justify-between gap-2 text-sm"
                    >
                      <span className="text-foreground min-w-0 truncate">
                        {row.name}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {row.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
