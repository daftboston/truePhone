"use client";

/**
 * @file seller-listings-toolbar.tsx
 * @description GET search/filter/sort toolbar for the seller listing hub.
 * @dependencies @/components/ui/input, @/components/ui/select, listing labels, hub query
 */

import type { ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  statusesForVista,
  type SellerListingsQuery,
  type SellerListingSort,
} from "@/features/listings/lib/seller-listing-hub";
import { listingStatusLabel } from "@/features/listings/schemas/listing";

const SORT_OPTIONS: { value: SellerListingSort; label: string }[] = [
  { value: "created_desc", label: "Creado (más reciente)" },
  { value: "created_asc", label: "Creado (más antiguo)" },
  { value: "updated_desc", label: "Actualizado recientemente" },
  { value: "price_desc", label: "Precio (mayor)" },
  { value: "price_asc", label: "Precio (menor)" },
];

type SellerListingsToolbarProps = {
  query: SellerListingsQuery;
};

/**
 * submitOnChange
 *
 * Submits the parent GET form when a select changes.
 *
 * @param event - Select change event.
 * @returns void
 * @calledBy SellerListingsToolbar selects
 */
function submitOnChange(event: ChangeEvent<HTMLSelectElement>) {
  event.currentTarget.form?.requestSubmit();
}

/**
 * SellerListingsToolbar
 *
 * Server-first GET filters for `/vender`. Select changes submit immediately;
 * search submits on enter.
 *
 * @param props.query - Current parsed hub query (used as default values).
 * @returns Filter form for SellPage.
 * @calledBy SellPage
 */
export function SellerListingsToolbar({ query }: SellerListingsToolbarProps) {
  const statuses = statusesForVista(query.vista);

  return (
    <form
      action="/vender"
      method="get"
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      {query.vista === "archivados" ? (
        <input type="hidden" name="vista" value="archivados" />
      ) : null}
      <label className="sr-only" htmlFor="seller-listings-q">
        Buscar anuncios
      </label>
      <Input
        id="seller-listings-q"
        type="search"
        name="q"
        defaultValue={query.q}
        placeholder="Buscar anuncios"
        className="sm:min-w-0 sm:flex-1"
      />
      <label className="sr-only" htmlFor="seller-listings-estado">
        Estado
      </label>
      <Select
        id="seller-listings-estado"
        name="estado"
        defaultValue={query.estado}
        onChange={submitOnChange}
        className="sm:w-44"
      >
        <option value="">Todos los estados</option>
        {statuses.map((status) => (
          <option key={status} value={status}>
            {listingStatusLabel(status)}
          </option>
        ))}
      </Select>
      <label className="sr-only" htmlFor="seller-listings-orden">
        Ordenar
      </label>
      <Select
        id="seller-listings-orden"
        name="orden"
        defaultValue={query.orden}
        onChange={submitOnChange}
        className="sm:w-56"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </form>
  );
}
