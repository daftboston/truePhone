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
import {
  loadOpsAnalytics,
  parseOpsAnalyticsRange,
  type OpsAnalyticsRange,
} from "@/lib/ops-analytics";

export const metadata: Metadata = {
  title: "Analítica",
  description: "Métricas internas del marketplace TruePhone.",
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
  href?: string;
};

/**
 * StatCard
 *
 * One metric tile on the ops analytics dashboard.
 *
 * @param props.title - Metric name.
 * @param props.value - Formatted primary value.
 * @param props.hint - Supporting copy.
 * @param props.href - Optional queue/deep link.
 * @returns Card tile.
 * @calledBy OpsAnalyticsPage
 */
function StatCard({ title, value, hint, href }: StatCardProps) {
  const card = (
    <Card className={href ? "hover:bg-muted/40 transition-colors" : undefined}>
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

  if (!href) return card;

  return (
    <Link href={href} className="block rounded-xl focus-visible:outline-none">
      {card}
    </Link>
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
type PageProps = {
  searchParams: Promise<{ rango?: string }>;
};

const RANGE_CHIPS: { id: OpsAnalyticsRange; label: string }[] = [
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "all", label: "Todo" },
];

export default async function OpsAnalyticsPage({ searchParams }: PageProps) {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/analitica");

  if (!canAccessReviewPortal(current.profile.role)) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden ver la analítica."
          action={
            <Button asChild variant="outline">
              <Link href="/perfil">Volver a Mi TruePhone</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const params = await searchParams;
  const range = parseOpsAnalyticsRange(params.rango);
  const stats = await loadOpsAnalytics(range);
  const rangeHint =
    range === "7d"
      ? "Últimos 7 días."
      : range === "30d"
        ? "Últimos 30 días."
        : "Todo el tiempo.";

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
          Solo el equipo de TruePhone. Las vistas no aparecen en perfiles
          públicos ni en las tarjetas de pedido. {rangeHint} Las colas son el
          trabajo abierto ahora.
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Rango de analítica"
        >
          {RANGE_CHIPS.map((chip) => {
            const selected = chip.id === range;
            const href =
              chip.id === "all"
                ? "/revision/analitica"
                : `/revision/analitica?rango=${chip.id}`;
            return (
              <Link
                key={chip.id}
                href={href}
                role="tab"
                aria-selected={selected}
                className={
                  selected
                    ? "border-primary bg-primary text-primary-foreground rounded-full border px-3.5 py-1.5 text-sm font-medium"
                    : "border-border bg-background text-foreground hover:bg-muted rounded-full border px-3.5 py-1.5 text-sm font-medium"
                }
              >
                {chip.label}
              </Link>
            );
          })}
        </div>
      </div>

      <section
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Resumen"
      >
        <StatCard
          title="GMV liquidado"
          value={formatOrderMoney(stats.settledGmvPesos)}
          hint={`${stats.settledOrderCount} pedido${stats.settledOrderCount === 1 ? "" : "s"} con desembolso completado. ${rangeHint}`}
        />
        <StatCard
          title="Comisión cobrada"
          value={formatOrderMoney(stats.settledFeePesos)}
          hint="Suma de la tarifa de marketplace en pedidos liquidados."
        />
        <StatCard
          title="Vistas de anuncios"
          value={stats.listingViewCount.toLocaleString("es-CO")}
          hint={`Visitantes únicos por anuncio y por día. Sin el vendedor ni crawlers. ${rangeHint}`}
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
            hint="Visibles en el marketplace ahora."
            href="/explorar"
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
            href="/revision/anuncios?tab=pendiente"
          />
          <StatCard
            title="Rechazados"
            value={String(stats.listingStatusCounts.rejected)}
            hint="Pendientes de corrección del vendedor."
            href="/revision/anuncios?tab=rechazados"
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
            href="/revision/anuncios?tab=pendiente"
          />
          <StatCard
            title="Identidad"
            value={String(stats.queue.identityPending)}
            hint="Cédula y selfie por revisar."
            href="/revision/identidad"
          />
          <StatCard
            title="Soporte de pedidos"
            value={String(stats.queue.orderSupport)}
            hint="Casos accionables de vendedores."
            href="/revision/soporte-pedidos?tab=pendientes"
          />
          <StatCard
            title="Preguntas"
            value={String(stats.queue.questionReports)}
            hint="Reportes abiertos de Q&A."
            href="/revision/preguntas"
          />
          <StatCard
            title="Reseñas"
            value={String(stats.queue.reviewReports)}
            hint="Reportes abiertos de calificaciones."
            href="/revision/resenas"
          />
          <StatCard
            title="Liquidaciones"
            value={String(stats.queue.payoutsAuthorized)}
            hint="Autorizadas, pendientes de pago en Wompi."
            href="/revision/pagos"
          />
          <StatCard
            title="Disputas"
            value={String(stats.queue.disputesFrozen)}
            hint="Pagos congelados."
            href="/revision/disputas"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2" aria-label="Detalle">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anuncios más vistos</CardTitle>
            <CardDescription>
              Conteos privados para el equipo de TruePhone. No se muestran al
              público.
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
