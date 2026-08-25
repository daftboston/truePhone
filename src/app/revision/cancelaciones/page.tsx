/**
 * @file page.tsx
 * @description REVIEWER/ADMIN queue to cancel PAID orders as seller abandon.
 * @dependencies ops-seller-abandon helpers, OpsSellerAbandonCancelForm
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OpsSellerAbandonCancelForm } from "@/features/orders/components/ops-seller-abandon-cancel-form";
import {
  canAccessReviewPortal,
  getCurrentProfile,
  roleLabel,
} from "@/lib/auth/session";
import { formatOrderMoney } from "@/lib/orders";
import {
  findOrderForOpsSellerAbandon,
  isEligibleForOpsSellerAbandonCancel,
  listPaidOrdersForOpsSellerAbandon,
  type OpsSellerAbandonOrder,
} from "@/lib/orders/ops-seller-abandon";

export const metadata: Metadata = {
  title: "Cancelaciones (abandono)",
  description:
    "Cancelar pedidos pagados como abandono del vendedor: 8% o reembolso para el comprador.",
};

/**
 * formatWhen
 *
 * Formats a timestamp for ops queue cards.
 *
 * @param date - Instant to display.
 * @returns Medium es-CO date and short time.
 * @calledBy OpsCancelacionesPage
 */
function formatWhen(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * partyName
 *
 * Short display name for buyer/seller on an ops card.
 *
 * @param party - Profile name fields.
 * @returns Full name, username, or id.
 * @calledBy OpsCancelacionesPage
 */
function partyName(party: {
  fullName: string | null;
  username: string | null;
  id: string;
}) {
  return party.fullName ?? party.username ?? party.id;
}

/**
 * eligibilityNote
 *
 * Spanish reason when a looked-up order cannot be abandoned-cancelled.
 *
 * @param order - Loaded order or null.
 * @returns Null when eligible; otherwise a user-facing explanation.
 * @calledBy OpsCancelacionesPage
 */
function eligibilityNote(order: OpsSellerAbandonOrder | null): string | null {
  if (!order) return "No encontramos ese pedido.";
  if (order.status !== "PAID") {
    return `Estado actual: ${order.status}. Solo pedidos PAID en custodia se cancelan como abandono.`;
  }
  if (order.sellerFulfillmentAbandonedAt) {
    return "Este pedido ya quedó marcado como abandono del vendedor.";
  }
  if (!isEligibleForOpsSellerAbandonCancel(order)) {
    return "Ya no se puede cancelar: el comprador marcó recepción o la liquidación ya está autorizada. Usa Disputas si hace falta.";
  }
  return null;
}

type PageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

/**
 * OpsCancelacionesPage
 *
 * REVIEWER/ADMIN: look up a paid order from support mail and cancel as seller abandon.
 *
 * @returns Cancelaciones ops page.
 */
export default async function OpsCancelacionesPage({
  searchParams,
}: PageProps) {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/cancelaciones");

  if (!canAccessReviewPortal(current.profile.role)) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Acceso restringido"
          description="Solo revisores y administradores pueden cancelar pedidos como abandono del vendedor."
          action={
            <Button asChild variant="outline">
              <Link href="/revision">Volver a revisión</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const params = await searchParams;
  const lookupId = params.orderId?.trim() || null;
  const [queue, lookedUp] = await Promise.all([
    listPaidOrdersForOpsSellerAbandon(40),
    lookupId ? findOrderForOpsSellerAbandon(lookupId) : Promise.resolve(null),
  ]);

  const lookupBlocked = lookedUp
    ? eligibilityNote(lookedUp)
    : lookupId
      ? eligibilityNote(null)
      : null;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Cancelaciones (abandono)
          </h1>
          <Badge variant="outline">{roleLabel(current.profile.role)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Cuando un vendedor escribe a soporte tras el pago, cancela aquí como
          abandono: el comprador elige reembolso o 8% una vez; el anuncio vuelve
          a la cola de revisión.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/revision">Volver al centro</Link>
        </Button>
      </div>

      <section className="space-y-3" aria-label="Buscar por id de pedido">
        <h2 className="text-foreground text-sm font-semibold">
          Buscar pedido (correo de soporte)
        </h2>
        <form
          method="get"
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor="orderId" className="text-muted-foreground text-xs">
              Id del pedido
            </label>
            <Input
              id="orderId"
              name="orderId"
              defaultValue={lookupId ?? ""}
              placeholder="pega el orderId del correo"
              autoComplete="off"
            />
          </div>
          <Button type="submit" variant="outline">
            Buscar
          </Button>
        </form>

        {lookupId ? (
          lookedUp ? (
            <article className="border-border space-y-3 rounded-xl border p-4">
              <OrderCardHeader order={lookedUp} />
              <OpsSellerAbandonCancelForm
                orderId={lookedUp.id}
                listingTitle={lookedUp.listing.title}
                disabled={Boolean(lookupBlocked)}
                disabledReason={lookupBlocked}
              />
            </article>
          ) : (
            <p className="text-destructive text-sm" role="alert">
              {lookupBlocked}
            </p>
          )
        ) : null}
      </section>

      <section className="space-y-3" aria-label="Pedidos pagados cancelables">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-foreground text-sm font-semibold">
            Pedidos pagados en custodia
          </h2>
          <Badge variant="secondary">{queue.length}</Badge>
        </div>
        {queue.length === 0 ? (
          <EmptyState
            title="Nada pendiente"
            description="No hay pedidos PAID cancelables como abandono ahora mismo."
          />
        ) : (
          <ul className="space-y-3">
            {queue.map((order) => (
              <li
                key={order.id}
                className="border-border space-y-3 rounded-xl border p-4"
              >
                <OrderCardHeader order={order} />
                <OpsSellerAbandonCancelForm
                  orderId={order.id}
                  listingTitle={order.listing.title}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/**
 * OrderCardHeader
 *
 * Summary block for an ops seller-abandon queue card.
 *
 * @param props.order - Order row from the ops query.
 * @returns Title, parties, amounts, and paid time.
 * @calledBy OpsCancelacionesPage
 */
function OrderCardHeader({ order }: { order: OpsSellerAbandonOrder }) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-foreground text-sm font-semibold">
          {order.listing.title}
        </p>
        <Badge variant="outline">{order.listing.status}</Badge>
      </div>
      <p className="text-muted-foreground font-mono text-xs break-all">
        {order.id}
      </p>
      <dl className="text-muted-foreground grid gap-1 text-xs sm:grid-cols-2">
        <div>
          <dt className="inline">Vendedor · </dt>
          <dd className="text-foreground inline">{partyName(order.seller)}</dd>
        </div>
        <div>
          <dt className="inline">Comprador · </dt>
          <dd className="text-foreground inline">{partyName(order.buyer)}</dd>
        </div>
        <div>
          <dt className="inline">Total · </dt>
          <dd className="text-foreground inline">
            {formatOrderMoney(order.totalPrice, order.currency)}
          </dd>
        </div>
        <div>
          <dt className="inline">Pagado · </dt>
          <dd className="text-foreground inline">{formatWhen(order.paidAt)}</dd>
        </div>
      </dl>
    </div>
  );
}
