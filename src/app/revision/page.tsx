/**
 * @file page.tsx
 * @description Reviewer/admin hub linking listing, identity, payments, and review queues.
 * @dependencies Review portal access checks and queue summaries
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  ChevronRight,
  ClipboardList,
  CreditCard,
  MessageSquareWarning,
  ShieldAlert,
  Star,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
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
import { countPaymentsByStatus } from "@/lib/payments";
import { countAuthorizedPayouts } from "@/lib/payments/ops-payouts";
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
      <AppShell mainClassName="max-w-lg justify-center">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden ver el centro de revisión."
          action={
            <Button asChild variant="outline">
              <Link href="/perfil">Volver a Mi TruePhone</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const isAdmin = current.profile.role === "ADMIN";

  const [
    listingCounts,
    identityPending,
    paymentCounts,
    authorizedPayoutCount,
    reviewReportsOpen,
  ] = await Promise.all([
    countListingsForReview(),
    countPendingIdentityVerifications(),
    isAdmin ? countPaymentsByStatus() : Promise.resolve(null),
    isAdmin ? countAuthorizedPayouts() : Promise.resolve(0),
    countOpenReviewReports(),
  ]);

  const firstName =
    current.profile.fullName?.trim().split(/\s+/)[0] ?? "equipo";

  const listingsHot =
    listingCounts.pendiente + listingCounts.enRevision >= identityPending;
  const openWork =
    listingCounts.pendiente +
    listingCounts.enRevision +
    identityPending +
    reviewReportsOpen;

  return (
    <AppShell mainClassName="max-w-2xl gap-8">
      <div className="space-y-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/perfil">← Mi TruePhone</Link>
        </Button>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground text-xl font-semibold tracking-tight md:text-2xl">
              Cola de confianza
            </h1>
            <Badge variant="outline">{roleLabel(current.profile.role)}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Hola, {firstName}. Protege la calidad del marketplace antes de que
            un anuncio sea público.
          </p>
          <p className="text-foreground text-sm font-medium">
            {openWork === 0
              ? "No hay trabajo pendiente en las colas activas."
              : `${openWork} elemento${openWork === 1 ? "" : "s"} por atender.`}
          </p>
        </div>
      </div>

      <section className="space-y-3" aria-label="Colas activas">
        <h2 className="text-foreground text-sm font-semibold">Colas activas</h2>
        <div className="grid gap-3">
          <QueueCard
            href="/revision/anuncios?tab=pendiente"
            title="Anuncios pendientes"
            description="Sin revisor asignado. Tómalos al abrir."
            count={listingCounts.pendiente}
            icon={ClipboardList}
            emphasized={listingsHot && listingCounts.pendiente > 0}
          />
          <QueueCard
            href="/revision/anuncios?tab=en_revision"
            title="Anuncios en revisión"
            description="Ya reclamados por un revisor."
            count={listingCounts.enRevision}
            icon={ClipboardList}
          />
          <QueueCard
            href="/revision/identidad"
            title="Identidad de vendedores"
            description="Cédula y selfie pendientes de aprobación."
            count={identityPending}
            icon={BadgeCheck}
            emphasized={!listingsHot && identityPending > 0}
          />
          <QueueCard
            href="/revision/resenas"
            title="Reseñas reportadas"
            description="Moderación de calificaciones del marketplace."
            count={reviewReportsOpen}
            icon={reviewReportsOpen > 0 ? MessageSquareWarning : Star}
            emphasized={reviewReportsOpen > 0}
          />
        </div>
      </section>

      <section className="space-y-3" aria-label="Accesos rápidos">
        <h2 className="text-foreground text-sm font-semibold">Accesos</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            asChild
            className="sm:flex-1"
            variant={listingsHot || openWork === 0 ? "default" : "outline"}
          >
            <Link href="/revision/anuncios">Ir a cola de anuncios</Link>
          </Button>
          <Button
            asChild
            className="sm:flex-1"
            variant={
              !listingsHot && identityPending > 0 ? "default" : "outline"
            }
          >
            <Link href="/revision/identidad">Ir a cola de identidad</Link>
          </Button>
        </div>
      </section>

      {isAdmin ? (
        <section className="space-y-3" aria-label="Administración">
          <h2 className="text-foreground text-sm font-semibold">
            Administración
          </h2>
          <QueueCard
            href="/revision/pagos"
            title="Liquidaciones y cobros"
            description="Paga en Wompi las liquidaciones autorizadas; historial de checkout."
            count={
              (authorizedPayoutCount ?? 0) +
              (paymentCounts
                ? paymentCounts.SUCCEEDED +
                  paymentCounts.PENDING +
                  paymentCounts.REQUIRES_ACTION +
                  paymentCounts.FAILED +
                  paymentCounts.REFUNDED
                : 0)
            }
            icon={CreditCard}
            emphasized={(authorizedPayoutCount ?? 0) > 0}
          />
          <aside className="border-border bg-muted/50 flex gap-3 rounded-xl border p-4">
            <ShieldAlert
              className="text-muted-foreground mt-0.5 size-5 shrink-0"
              aria-hidden
            />
            <div className="space-y-1 text-sm">
              <p className="text-foreground font-semibold">Más admin</p>
              <p className="text-muted-foreground leading-relaxed">
                Dispersión al vendedor es manual en Wompi (supervisión). La API
                automática llega en Phase 24.
              </p>
            </div>
          </aside>
        </section>
      ) : null}
    </AppShell>
  );
}
