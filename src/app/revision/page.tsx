/**
 * @file page.tsx
 * @description Reviewer/admin hub linking listing, identity, payments, disputes, review, Q&A, and analytics.
 * @dependencies Review portal access checks and queue summaries
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  BarChart3,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  LifeBuoy,
  MessageSquareWarning,
  ShieldAlert,
  Star,
  Tags,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { countPendingIdentityVerifications } from "@/lib/auth/identity";
import {
  canAccessReviewPortal,
  getCurrentProfile,
  roleLabel,
} from "@/lib/auth/session";
import { countListingsForReview } from "@/lib/listings-review";
import { countOpsDisputeQueue } from "@/lib/payments/ops-disputes";
import { countAuthorizedPayouts } from "@/lib/payments/ops-payouts";
import { countRecommendedPrices } from "@/lib/recommended-prices";
import { countActionableOrderSupportCases } from "@/lib/orders/order-support-service";
import { countActionablePqrCases } from "@/lib/pqr/pqr-service";
import { countOpenListingQuestionReports } from "@/lib/listing-qa";
import { countOpenReviewReports } from "@/lib/reviews";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Revisión",
  description: "Colas de confianza para revisores y administradores TruePhone.",
};

type QueueCardProps = {
  href: string;
  title: string;
  description: string;
  count: number;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  emphasized?: boolean;
};

/**
 * QueueCard
 *
 * Linked count card for one ops queue. Emphasized cards mark work that needs
 * attention; counts must be real queue sizes, not vanity metrics.
 *
 * @param props.href - Queue destination.
 * @param props.title - Queue name.
 * @param props.description - One-line scope.
 * @param props.count - Honest pending/open count.
 * @param props.icon - Lucide icon.
 * @param props.emphasized - Highlights the hottest operational queue.
 * @returns Linked card.
 * @calledBy ReviewHubPage
 */
function QueueCard({
  href,
  title,
  description,
  count,
  icon: Icon,
  emphasized = false,
}: QueueCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "border-border hover:bg-muted/50 flex items-start gap-3 rounded-xl border p-4 transition-colors",
        emphasized && "border-primary/40 bg-primary/5 hover:bg-primary/10",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          emphasized
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-foreground text-sm font-semibold">{title}</p>
          {emphasized && count > 0 ? (
            <Badge variant="secondary">Prioritaria</Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs leading-snug">
          {description}
        </p>
        <p className="text-foreground pt-1 text-2xl font-semibold tracking-tight tabular-nums">
          {count}
        </p>
      </div>
      <ChevronRight
        className="text-muted-foreground mt-1 size-4 shrink-0"
        aria-hidden
      />
    </Link>
  );
}

type HubPrimaryCta = {
  href: string;
  label: string;
  count: number;
};

/**
 * hottestHubCta
 *
 * Picks the single primary button: the queue with the most open work.
 * Falls back to the listing queue when every count is zero.
 *
 * @param queues - Candidate CTAs with counts.
 * @returns Highest-count CTA, or the first candidate when all are empty.
 * @calledBy ReviewHubPage
 */
function hottestHubCta(queues: HubPrimaryCta[]): HubPrimaryCta {
  const emptyFallback: HubPrimaryCta = {
    href: "/revision/anuncios",
    label: "Ir a cola de anuncios",
    count: 0,
  };
  const hottest = queues.reduce(
    (best, queue) => (queue.count > best.count ? queue : best),
    emptyFallback,
  );
  return hottest.count > 0 ? hottest : emptyFallback;
}

/**
 * ReviewHubPage
 *
 * Entry dashboard for staff review portals.
 *
 * @returns Review hub with queue links and counts.
 */
export default async function ReviewHubPage() {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision");

  if (!canAccessReviewPortal(current.profile.role)) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden ver el centro de revisión."
          action={
            <Button asChild variant="outline">
              <Link href="/perfil">Volver a Mi TruePhone</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isAdmin = current.profile.role === "ADMIN";

  const [
    listingCounts,
    identityPending,
    authorizedPayoutCount,
    disputeQueueCount,
    recommendedPriceCount,
    reviewReportsOpen,
    questionReportsOpen,
    orderSupportCount,
    pqrCount,
  ] = await Promise.all([
    countListingsForReview(),
    countPendingIdentityVerifications(),
    isAdmin ? countAuthorizedPayouts() : Promise.resolve(0),
    isAdmin ? countOpsDisputeQueue() : Promise.resolve(0),
    isAdmin ? countRecommendedPrices() : Promise.resolve(0),
    countOpenReviewReports(),
    countOpenListingQuestionReports(),
    countActionableOrderSupportCases(),
    countActionablePqrCases(),
  ]);

  const firstName =
    current.profile.fullName?.trim().split(/\s+/)[0] ?? "equipo";

  const openWork =
    listingCounts.pendiente +
    listingCounts.enRevision +
    identityPending +
    orderSupportCount +
    pqrCount +
    reviewReportsOpen +
    questionReportsOpen +
    (isAdmin ? authorizedPayoutCount + disputeQueueCount : 0);

  const primaryCta = hottestHubCta([
    {
      href: "/revision/anuncios?tab=pendiente",
      label: "Ir a anuncios pendientes",
      count: listingCounts.pendiente,
    },
    {
      href: "/revision/anuncios?tab=en_revision",
      label: "Ir a anuncios en revisión",
      count: listingCounts.enRevision,
    },
    {
      href: "/revision/identidad",
      label: "Ir a cola de identidad",
      count: identityPending,
    },
    {
      href: "/revision/resenas",
      label: "Ir a reseñas reportadas",
      count: reviewReportsOpen,
    },
    {
      href: "/revision/preguntas",
      label: "Ir a preguntas reportadas",
      count: questionReportsOpen,
    },
    {
      href: "/revision/soporte-pedidos?tab=pendientes",
      label: "Ir a soporte de pedidos",
      count: orderSupportCount,
    },
    {
      href: "/revision/pqr?tab=pendientes",
      label: "Ir a PQR",
      count: pqrCount,
    },
    ...(isAdmin
      ? [
          {
            href: "/revision/pagos",
            label: "Ir a liquidaciones",
            count: authorizedPayoutCount,
          },
          {
            href: "/revision/disputas",
            label: "Ir a disputas",
            count: disputeQueueCount,
          },
        ]
      : []),
  ]);

  const hottestWorkHref = primaryCta.count > 0 ? primaryCta.href : "";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
            Cola de confianza
          </h1>
          <Badge variant="outline">{roleLabel(current.profile.role)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Hola, {firstName}. Protege la calidad del marketplace antes de que un
          anuncio sea público.
        </p>
        <p className="text-foreground text-sm font-medium">
          {openWork === 0
            ? "No hay trabajo pendiente en las colas activas."
            : `${openWork} elemento${openWork === 1 ? "" : "s"} por atender.`}
        </p>
      </div>

      <section className="space-y-3" aria-label="Colas activas">
        <h2 className="text-foreground text-sm font-semibold">Colas activas</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <QueueCard
            href="/revision/anuncios?tab=pendiente"
            title="Anuncios pendientes"
            description="Sin revisor asignado. Tómalos al abrir."
            count={listingCounts.pendiente}
            icon={ClipboardList}
            emphasized={hottestWorkHref.includes(
              "/revision/anuncios?tab=pendiente",
            )}
          />
          <QueueCard
            href="/revision/anuncios?tab=en_revision"
            title="Anuncios en revisión"
            description="Ya reclamados por un revisor."
            count={listingCounts.enRevision}
            icon={ClipboardList}
            emphasized={hottestWorkHref.includes("en_revision")}
          />
          <QueueCard
            href="/revision/identidad"
            title="Identidad de vendedores"
            description="Cédula y selfie pendientes de aprobación."
            count={identityPending}
            icon={BadgeCheck}
            emphasized={hottestWorkHref.startsWith("/revision/identidad")}
          />
          <QueueCard
            href="/revision/resenas"
            title="Reseñas reportadas"
            description="Moderación de calificaciones del marketplace."
            count={reviewReportsOpen}
            icon={reviewReportsOpen > 0 ? MessageSquareWarning : Star}
            emphasized={hottestWorkHref.startsWith("/revision/resenas")}
          />

          <QueueCard
            href="/revision/preguntas"
            title="Preguntas reportadas"
            description="Moderación de preguntas y respuestas públicas."
            count={questionReportsOpen}
            icon={questionReportsOpen > 0 ? MessageSquareWarning : Star}
            emphasized={hottestWorkHref.startsWith("/revision/preguntas")}
          />

          <QueueCard
            href="/revision/soporte-pedidos?tab=pendientes"
            title="Soporte de pedidos"
            description="Solicitudes de cancelación, problemas de envío y preguntas de vendedores."
            count={orderSupportCount}
            icon={LifeBuoy}
            emphasized={hottestWorkHref.startsWith("/revision/soporte-pedidos")}
          />
          <QueueCard
            href="/revision/pqr?tab=pendientes"
            title="PQR"
            description="Peticiones, quejas, reclamos y retracto de consumidores."
            count={pqrCount}
            icon={FileText}
            emphasized={hottestWorkHref.startsWith("/revision/pqr")}
          />
        </div>
      </section>

      <section className="space-y-3" aria-label="Accesos rápidos">
        <h2 className="text-foreground text-sm font-semibold">Accesos</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild>
            <Link href={primaryCta.href}>{primaryCta.label}</Link>
          </Button>
          <Link
            href="/revision/analitica"
            className="text-primary inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
          >
            <BarChart3 className="size-4" aria-hidden />
            Ver analítica
          </Link>
          <Link
            href="/revision/ventas"
            className="text-primary inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
          >
            Ver libro de ventas
          </Link>
        </div>
      </section>

      {isAdmin ? (
        <section className="space-y-3" aria-label="Administración">
          <h2 className="text-foreground text-sm font-semibold">
            Administración
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <QueueCard
              href="/revision/pagos"
              title="Liquidaciones y cobros"
              description="Liquidaciones autorizadas listas para pagar en Wompi."
              count={authorizedPayoutCount}
              icon={CreditCard}
              emphasized={hottestWorkHref.startsWith("/revision/pagos")}
            />
            <QueueCard
              href="/revision/disputas"
              title="Disputas y contracargos"
              description="Pagos congelados, reembolsos ops y pérdidas absorbidas en Cuenta Wompi."
              count={disputeQueueCount}
              icon={ShieldAlert}
              emphasized={hottestWorkHref.startsWith("/revision/disputas")}
            />
            <Link
              href="/revision/precios"
              className="border-border hover:bg-muted/50 flex items-start gap-3 rounded-xl border p-4 transition-colors"
            >
              <span className="bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                <Tags className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-foreground text-sm font-semibold">
                  Precios de referencia
                </p>
                <p className="text-muted-foreground text-xs leading-snug">
                  Guía para vendedores. No es una cola de trabajo.
                </p>
                <p className="text-muted-foreground pt-1 text-sm">
                  {recommendedPriceCount} combinación
                  {recommendedPriceCount === 1 ? "" : "es"} en la tabla
                </p>
              </div>
              <ChevronRight
                className="text-muted-foreground mt-1 size-4 shrink-0"
                aria-hidden
              />
            </Link>
            <aside className="border-border bg-muted/50 flex gap-3 rounded-xl border p-4">
              <ShieldAlert
                className="text-muted-foreground mt-0.5 size-5 shrink-0"
                aria-hidden
              />
              <div className="space-y-1 text-sm">
                <p className="text-foreground font-semibold">Más admin</p>
                <p className="text-muted-foreground leading-relaxed">
                  La liquidación al vendedor se paga a mano en Wompi. Revisa
                  cada envío antes de confirmarlo.
                </p>
              </div>
            </aside>
          </div>
        </section>
      ) : null}
    </div>
  );
}
