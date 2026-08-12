/**
 * @file page.tsx
 * @description Admin CRUD for recommended iPhone prices (model + storage + condition).
 * @dependencies Catalog helpers, recommended-price actions/components
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { conditionLabels } from "@/features/listings/schemas/listing";
import { DeleteRecommendedPriceButton } from "@/features/recommended-prices/components/delete-recommended-price-button";
import { RecommendedPriceForm } from "@/features/recommended-prices/components/recommended-price-form";
import { getCurrentProfile, roleLabel } from "@/lib/auth/session";
import { formatOrderMoney } from "@/lib/format-money";
import { getCatalog } from "@/lib/listings";
import {
  getRecommendedPriceById,
  isRecommendedPriceEffective,
  listRecommendedPrices,
} from "@/lib/recommended-prices";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Precios de referencia",
  description:
    "Tabla de precios recomendados por modelo, almacenamiento y estado.",
};

type PageProps = {
  searchParams: Promise<{ edit?: string }>;
};

/**
 * AdminRecommendedPricesPage
 *
 * ADMIN-only UI to maintain seller pricing guidance rows.
 *
 * @param props.searchParams.edit - Optional row id to prefill the form.
 * @returns Recommended prices admin page.
 */
export default async function AdminRecommendedPricesPage({
  searchParams,
}: PageProps) {
  const current = await getCurrentProfile();
  if (!current) redirect("/login?next=/revision/precios");

  if (current.profile.role !== "ADMIN") {
    return (
      <AppShell mainClassName="max-w-lg justify-center">
        <EmptyState
          title="Acceso restringido"
          description="Solo administradores pueden gestionar la tabla de precios de referencia."
          action={
            <Button asChild variant="outline">
              <Link href="/revision">Volver a revisión</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const params = await searchParams;
  const [rows, catalog, editing] = await Promise.all([
    listRecommendedPrices(),
    getCatalog(),
    params.edit ? getRecommendedPriceById(params.edit) : Promise.resolve(null),
  ]);

  const formCatalog = {
    models: catalog.models.map((model) => ({
      id: model.id,
      name: model.name,
    })),
    storages: catalog.storages.map((storage) => ({
      id: storage.id,
      valueGb: storage.valueGb,
    })),
  };

  const initial = editing
    ? {
        id: editing.id,
        iphoneModelId: editing.iphoneModelId,
        iphoneStorageId: editing.iphoneStorageId,
        condition: editing.condition,
        priceCop: editing.priceCop,
        minPriceCop: editing.minPriceCop,
        maxPriceCop: editing.maxPriceCop,
        notes: editing.notes,
        effectiveFrom: editing.effectiveFrom,
        effectiveTo: editing.effectiveTo,
      }
    : null;

  return (
    <AppShell mainClassName="max-w-4xl gap-8">
      <div className="space-y-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/revision">← Cola de confianza</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Precios de referencia
          </h1>
          <Badge variant="outline">{roleLabel(current.profile.role)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Guía para vendedores por modelo, almacenamiento y estado físico. No
          obliga el precio del anuncio; solo orienta.
        </p>
      </div>

      <section
        className="border-border space-y-4 rounded-xl border p-4"
        aria-label={editing ? "Editar precio" : "Nuevo precio"}
      >
        <div className="space-y-1">
          <h2 className="text-foreground text-sm font-semibold">
            {editing ? "Editar precio" : "Agregar o actualizar precio"}
          </h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {editing
              ? "Modifica la fila seleccionada. La combinación modelo + almacenamiento + estado debe ser única."
              : "Si la combinación ya existe, se actualiza el precio de referencia."}
          </p>
        </div>
        <RecommendedPriceForm catalog={formCatalog} initial={initial} />
      </section>

      <section className="space-y-3" aria-label="Tabla de precios">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-foreground text-sm font-semibold">
            Tabla actual
          </h2>
          <Badge variant="secondary">{rows.length}</Badge>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Sin precios de referencia"
            description="Agrega la primera combinación modelo + almacenamiento + estado arriba."
          />
        ) : (
          <div className="border-border overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-border border-b text-xs">
                <tr>
                  <th className="px-3 py-2 font-medium">Modelo</th>
                  <th className="px-3 py-2 font-medium">GB</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2 font-medium">Referencia</th>
                  <th className="px-3 py-2 font-medium">Banda</th>
                  <th className="px-3 py-2 font-medium">Vigencia</th>
                  <th className="px-3 py-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const effective = isRecommendedPriceEffective(row);
                  const label = `${row.iphoneModel.name} ${row.iphoneStorage.valueGb} GB · ${conditionLabels[row.condition]}`;
                  const band =
                    row.minPriceCop != null || row.maxPriceCop != null
                      ? `${row.minPriceCop != null ? formatOrderMoney(row.minPriceCop) : "—"} – ${row.maxPriceCop != null ? formatOrderMoney(row.maxPriceCop) : "—"}`
                      : "—";
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-border border-b last:border-b-0",
                        !effective && "bg-muted/30 text-muted-foreground",
                        editing?.id === row.id && "bg-primary/5",
                      )}
                    >
                      <td className="px-3 py-2.5 font-medium">
                        {row.iphoneModel.name}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {row.iphoneStorage.valueGb}
                      </td>
                      <td className="px-3 py-2.5">
                        {conditionLabels[row.condition]}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {formatOrderMoney(row.priceCop)}
                      </td>
                      <td className="px-3 py-2.5 text-xs tabular-nums">
                        {band}
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {effective ? (
                          <Badge variant="secondary">Activa</Badge>
                        ) : (
                          <Badge variant="outline">Fuera de vigencia</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/revision/precios?edit=${row.id}`}>
                              Editar
                            </Link>
                          </Button>
                          <DeleteRecommendedPriceButton
                            id={row.id}
                            label={label}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
