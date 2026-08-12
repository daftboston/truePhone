/**
 * @file recommended-price-form.tsx
 * @description Admin form to create or update a recommended price row.
 * @dependencies react, upsertRecommendedPriceAction, catalog selects
 */

"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Condition } from "@prisma/client";

import { upsertRecommendedPriceAction } from "@/features/recommended-prices/actions/recommended-prices";
import type { RecommendedPriceActionState } from "@/features/recommended-prices/types";
import { conditionLabels } from "@/features/listings/schemas/listing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type RecommendedPriceFormCatalog = {
  models: { id: string; name: string }[];
  storages: { id: string; valueGb: number }[];
};

export type RecommendedPriceFormValues = {
  id?: string;
  iphoneModelId: string;
  iphoneStorageId: string;
  condition: Condition;
  priceCop: number;
  minPriceCop?: number | null;
  maxPriceCop?: number | null;
  notes?: string | null;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
};

type RecommendedPriceFormProps = {
  catalog: RecommendedPriceFormCatalog;
  initial?: RecommendedPriceFormValues | null;
};

/**
 * toDateInputValue
 *
 * Formats a Date for an HTML date input (YYYY-MM-DD, UTC calendar day).
 *
 * @param value - Date or null/undefined.
 * @returns Date string or empty string.
 */
function toDateInputValue(value?: Date | null): string {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

/**
 * RecommendedPriceForm
 *
 * Collects model / storage / condition / COP reference (+ optional band & dates).
 *
 * @param props.catalog - iPhone models and storages for selects.
 * @param props.initial - Prefill when editing an existing row.
 * @returns Admin upsert form.
 * @calledBy AdminRecommendedPricesPage
 */
export function RecommendedPriceForm({
  catalog,
  initial,
}: RecommendedPriceFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    RecommendedPriceActionState,
    FormData
  >(upsertRecommendedPriceAction, null);

  const isEdit = Boolean(initial?.id);

  // After success, refresh the table; drop `?edit=` when leaving edit mode.
  useEffect(() => {
    if (state?.ok !== true) return;
    if (isEdit) {
      router.replace("/revision/precios");
    }
    router.refresh();
  }, [state, isEdit, router]);

  return (
    <form action={formAction} className="space-y-4">
      {initial?.id ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="iphoneModelId">Modelo</Label>
          <Select
            id="iphoneModelId"
            name="iphoneModelId"
            defaultValue={initial?.iphoneModelId ?? ""}
            required
            key={`model-${initial?.id ?? "new"}-${initial?.iphoneModelId ?? ""}`}
          >
            <option value="" disabled>
              Selecciona un modelo
            </option>
            {catalog.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </Select>
          {state?.ok === false && state.fieldErrors?.iphoneModelId ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.iphoneModelId[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="iphoneStorageId">Almacenamiento</Label>
          <Select
            id="iphoneStorageId"
            name="iphoneStorageId"
            defaultValue={initial?.iphoneStorageId ?? ""}
            required
            key={`storage-${initial?.id ?? "new"}-${initial?.iphoneStorageId ?? ""}`}
          >
            <option value="" disabled>
              Selecciona GB
            </option>
            {catalog.storages.map((storage) => (
              <option key={storage.id} value={storage.id}>
                {storage.valueGb} GB
              </option>
            ))}
          </Select>
          {state?.ok === false && state.fieldErrors?.iphoneStorageId ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.iphoneStorageId[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="condition">Estado físico</Label>
          <Select
            id="condition"
            name="condition"
            defaultValue={initial?.condition ?? ""}
            required
            key={`condition-${initial?.id ?? "new"}-${initial?.condition ?? ""}`}
          >
            <option value="" disabled>
              Selecciona estado
            </option>
            {(Object.keys(conditionLabels) as Condition[]).map((condition) => (
              <option key={condition} value={condition}>
                {conditionLabels[condition]}
              </option>
            ))}
          </Select>
          {state?.ok === false && state.fieldErrors?.condition ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.condition[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="priceCop">Precio de referencia (COP)</Label>
          <Input
            id="priceCop"
            name="priceCop"
            type="number"
            inputMode="numeric"
            min={100000}
            max={20000000}
            step={1000}
            defaultValue={initial?.priceCop ?? ""}
            required
            key={`price-${initial?.id ?? "new"}-${initial?.priceCop ?? ""}`}
          />
          {state?.ok === false && state.fieldErrors?.priceCop ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.priceCop[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="minPriceCop">Mínimo (opcional)</Label>
          <Input
            id="minPriceCop"
            name="minPriceCop"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            defaultValue={initial?.minPriceCop ?? ""}
            key={`min-${initial?.id ?? "new"}-${initial?.minPriceCop ?? ""}`}
          />
          {state?.ok === false && state.fieldErrors?.minPriceCop ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.minPriceCop[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxPriceCop">Máximo (opcional)</Label>
          <Input
            id="maxPriceCop"
            name="maxPriceCop"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            defaultValue={initial?.maxPriceCop ?? ""}
            key={`max-${initial?.id ?? "new"}-${initial?.maxPriceCop ?? ""}`}
          />
          {state?.ok === false && state.fieldErrors?.maxPriceCop ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.maxPriceCop[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="effectiveFrom">Vigente desde (opcional)</Label>
          <Input
            id="effectiveFrom"
            name="effectiveFrom"
            type="date"
            defaultValue={toDateInputValue(initial?.effectiveFrom)}
            key={`from-${initial?.id ?? "new"}-${toDateInputValue(initial?.effectiveFrom)}`}
          />
          {state?.ok === false && state.fieldErrors?.effectiveFrom ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.effectiveFrom[0]}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="effectiveTo">Vigente hasta (opcional)</Label>
          <Input
            id="effectiveTo"
            name="effectiveTo"
            type="date"
            defaultValue={toDateInputValue(initial?.effectiveTo)}
            key={`to-${initial?.id ?? "new"}-${toDateInputValue(initial?.effectiveTo)}`}
          />
          {state?.ok === false && state.fieldErrors?.effectiveTo ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.effectiveTo[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          placeholder="Fuente del precio, mercado, observaciones internas…"
          defaultValue={initial?.notes ?? ""}
          key={`notes-${initial?.id ?? "new"}-${initial?.notes ?? ""}`}
        />
        {state?.ok === false && state.fieldErrors?.notes ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.notes[0]}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Guardando…"
            : isEdit
              ? "Actualizar precio"
              : "Guardar precio"}
        </Button>
        {isEdit ? (
          <Button asChild variant="outline">
            <Link href="/revision/precios">Cancelar edición</Link>
          </Button>
        ) : null}
      </div>

      {state?.ok === false ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p className="text-foreground text-sm" role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
