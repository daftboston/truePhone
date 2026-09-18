/**
 * @file page.tsx
 * @description Ops sales ledger at /revision/ventas (F1).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  canAccessReviewPortal,
  getCurrentProfile,
  roleLabel,
} from "@/lib/auth/session";
import { formatOrderMoney } from "@/lib/orders";
import {
  countOpsSalesLedger,
  listOpsSalesLedger,
  opsSalesStatusLabel,
  stripBankFieldsFromLedgerRow,
} from "@/lib/ops-sales-ledger";
import { prisma } from "@/lib/db";
import type { OrderStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Ventas",
  description: "Libro de ventas operativo — solo lectura.",
};

function formatWhen(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

type SearchParams = Promise<{
  seller?: string;
  buyer?: string;
  modelo?: string;
  anuncio?: string;
  estado?: string;
  desde?: string;
  hasta?: string;
}>;

/**
 * AdminPaymentsPage
 *
 * Read-only ops ledger of order movements.
 */
export default async function OpsSalesLedgerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/ventas");

  if (!canAccessReviewPortal(current.profile.role)) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Acceso restringido"
          description="Solo personal de revisión puede ver el libro de ventas."
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
  const isAdmin = current.profile.role === "ADMIN";
  const status = params.estado as OrderStatus | undefined;
  const from = params.desde ? new Date(params.desde) : undefined;
  const to = params.hasta ? new Date(`${params.hasta}T23:59:59`) : undefined;

  const filters = {
    sellerId: params.seller?.trim() || undefined,
    buyerId: params.buyer?.trim() || undefined,
    modelId: params.modelo?.trim() || undefined,
    listingQ: params.anuncio?.trim() || undefined,
    status:
      status &&
      ["AWAITING_PAYMENT", "PAID", "CANCELLED", "COMPLETED"].includes(status)
        ? status
        : undefined,
    from: from && !Number.isNaN(from.getTime()) ? from : undefined,
    to: to && !Number.isNaN(to.getTime()) ? to : undefined,
    take: 80,
  };

  const [rows, total, models] = await Promise.all([
    listOpsSalesLedger(filters, isAdmin ? "ADMIN" : "REVIEWER"),
    countOpsSalesLedger(filters),
    prisma.iphoneModel.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Ventas
          </h1>
          <Badge variant="secondary">{roleLabel(current.profile.role)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Libro de ventas operativo (solo lectura). Pagos y desembolsos en{" "}
          <Link href="/revision/pagos" className="underline">
            Pagos
          </Link>
          .
        </p>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div className="space-y-1">
          <Label htmlFor="anuncio">Anuncio (slug o id)</Label>
          <Input
            id="anuncio"
            name="anuncio"
            defaultValue={params.anuncio ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="modelo">Modelo</Label>
          <Select id="modelo" name="modelo" defaultValue={params.modelo ?? ""}>
            <option value="">Todos</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="estado">Estado</Label>
          <Select id="estado" name="estado" defaultValue={params.estado ?? ""}>
            <option value="">Todos</option>
            <option value="AWAITING_PAYMENT">Sin pagar</option>
            <option value="PAID">Pagado</option>
            <option value="COMPLETED">Completado</option>
            <option value="CANCELLED">Cancelado</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="seller">ID vendedor</Label>
          <Input id="seller" name="seller" defaultValue={params.seller ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="buyer">ID comprador</Label>
          <Input id="buyer" name="buyer" defaultValue={params.buyer ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="desde">Desde</Label>
          <Input
            id="desde"
            name="desde"
            type="date"
            defaultValue={params.desde ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="hasta">Hasta</Label>
          <Input
            id="hasta"
            name="hasta"
            type="date"
            defaultValue={params.hasta ?? ""}
          />
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-3">
          <Button type="submit">Filtrar</Button>
        </div>
      </form>

      <p className="text-muted-foreground text-sm">
        {total} pedido{total === 1 ? "" : "s"} · ordenados por actividad
        reciente
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Prueba otros filtros o espera nuevas ventas."
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const safe = stripBankFieldsFromLedgerRow(row, isAdmin);
            const published = row.listing.publishedAt ?? row.listing.approvedAt;
            const premiumDelivery =
              row.shipment?.method === "PREMIUM_BOGOTA"
                ? row.shipment.deliveredAt
                : null;
            const carrierDelivery =
              row.shipment?.method === "CARRIER"
                ? row.shipment.deliveredAt
                : null;
            const buyerReceived = row.buyerConfirmedAt ? row.fundsHeldAt : null;

            return (
              <li
                key={row.id}
                className="rounded-xl border p-4"
                data-testid="ops-sales-row"
                data-order-id={row.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-foreground font-medium">
                      <Link
                        href={`/anuncios/${row.listing.slug}`}
                        className="hover:underline"
                      >
                        {row.listing.slug}
                      </Link>
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        · {row.listing.iphoneModel.name}
                      </span>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Pedido {row.id} · Anuncio {row.listing.id}
                    </p>
                  </div>
                  <Badge variant="outline">{opsSalesStatusLabel(row)}</Badge>
                </div>

                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Precio anuncio</dt>
                    <dd>{formatOrderMoney(row.equipmentPrice)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Vendedor</dt>
                    <dd>
                      {row.seller.fullName ??
                        row.seller.username ??
                        row.seller.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Comprador</dt>
                    <dd>
                      {row.buyer.fullName ?? row.buyer.username ?? row.buyer.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Publicado</dt>
                    <dd>{formatWhen(published)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Pagado</dt>
                    <dd>{formatWhen(row.paidAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Premium entregado</dt>
                    <dd>{formatWhen(premiumDelivery)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Carrier entregado</dt>
                    <dd>{formatWhen(carrierDelivery)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">«Ya recibí»</dt>
                    <dd>{formatWhen(row.buyerConfirmedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Ventana 24h</dt>
                    <dd>
                      {formatWhen(buyerReceived)} →{" "}
                      {formatWhen(row.buyerConfirmDeadlineAt)}
                    </dd>
                  </div>
                </dl>

                {isAdmin &&
                "payouts" in safe &&
                Array.isArray(safe.payouts) &&
                safe.payouts[0] ? (
                  <p className="text-muted-foreground mt-2 text-xs">
                    Banco:{" "}
                    {(
                      safe.payouts[0] as {
                        sellerBankAccount?: {
                          bankName?: string;
                          accountNumber?: string;
                        };
                      }
                    ).sellerBankAccount?.bankName ?? "—"}{" "}
                    ····
                    {(
                      (
                        safe.payouts[0] as {
                          sellerBankAccount?: { accountNumber?: string };
                        }
                      ).sellerBankAccount?.accountNumber ?? ""
                    ).slice(-4) || "—"}
                  </p>
                ) : null}

                <div className="mt-3">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/ventas/${row.id}`}>Ver pedido</Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
