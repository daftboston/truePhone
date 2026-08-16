"use client";

/**
 * @file device-details-form.tsx
 * @description Device details + price step for the sell wizard, with recommended price guide.
 * @dependencies react, @prisma/client, listings actions/schemas, SellerPriceGuide, @/lib/iphone-catalog
 */

import { useActionState, useMemo, useState } from "react";
import type {
  Condition,
  IphoneColor,
  IphoneModel,
  IphoneStorage,
} from "@prisma/client";

import {
  createListingAction,
  updateListingDetailsAction,
} from "@/features/listings/actions/listings";
import {
  BUYER_PROTECTION_FEE_RATE,
  computeFees,
  conditionLabels,
} from "@/features/listings/schemas/listing";
import type { ListingActionState } from "@/features/listings/types";
import { formatStorageLabel } from "@/lib/iphone-catalog";
import { SellerPriceGuide } from "@/features/recommended-prices/components/seller-price-guide";
import {
  sellerPriceGuideKey,
  type SellerPriceGuideEntry,
} from "@/features/recommended-prices/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type DeviceFormProps = {
  models: IphoneModel[];
  colors: IphoneColor[];
  storages: IphoneStorage[];
  colorIdsByModelId: Record<string, string[]>;
  storageIdsByModelId: Record<string, string[]>;
  /** Effective admin guide rows keyed by sellerPriceGuideKey. */
  priceGuideByCombo?: Record<string, SellerPriceGuideEntry>;
  listingId?: string;
  defaults?: {
    iphoneModelId: string;
    iphoneColorId: string;
    iphoneStorageId: string;
    condition: Condition;
    batteryHealth: number | null;
    price: number;
    description: string | null;
    hasBox: boolean;
    hasCharger: boolean;
    hasReceipt: boolean;
  };
};

/**
 * formatCop
 *
 * Formats integer COP for the in-form fee calculator.
 *
 * @param value - Amount in COP pesos.
 * @returns Localized currency string.
 * @calledBy DeviceDetailsForm
 */
function formatCop(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * parsePriceInput
 *
 * Strips non-digits and leading zeros while the seller types a COP price.
 *
 * @param raw - Raw input string from the price field.
 * @returns Display string and numeric amount (0 when empty).
 * @calledBy DeviceDetailsForm
 */
function parsePriceInput(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return { display: "", amount: 0 };
  // Strip leading zeros while typing (keeps a single 0 only if empty→0 mid-edit)
  const normalized = digits.replace(/^0+(?=\d)/, "");
  return { display: normalized, amount: Number(normalized) };
}

/**
 * DeviceDetailsForm
 *
 * Collects model, storage, condition, accessories, and listing price.
 * Shows a read-only RecommendedPrice guide when the combo matches.
 *
 * @param props - Catalog options, optional draft defaults, and price guide map.
 * @returns Device details form for create/update listing steps.
 * @calledBy NewListingPage, EditDevicePage
 */
export function DeviceDetailsForm({
  models,
  colors,
  storages,
  colorIdsByModelId,
  storageIdsByModelId,
  priceGuideByCombo = {},
  listingId,
  defaults,
}: DeviceFormProps) {
  const action = listingId
    ? updateListingDetailsAction.bind(null, listingId)
    : createListingAction;

  const [state, formAction, pending] = useActionState<
    ListingActionState,
    FormData
  >(action, null);

  const [selectedModelId, setSelectedModelId] = useState(
    defaults?.iphoneModelId ?? "",
  );
  const [selectedColorId, setSelectedColorId] = useState(
    defaults?.iphoneColorId ?? "",
  );
  const [selectedStorageId, setSelectedStorageId] = useState(
    defaults?.iphoneStorageId ?? "",
  );
  const [selectedCondition, setSelectedCondition] = useState<Condition | "">(
    defaults?.condition ?? "EXCELLENT",
  );

  const availableColors = useMemo(() => {
    if (!selectedModelId) return [];
    const allowed = new Set(colorIdsByModelId[selectedModelId] ?? []);
    return colors.filter((color) => allowed.has(color.id));
  }, [selectedModelId, colorIdsByModelId, colors]);

  const availableStorages = useMemo(() => {
    if (!selectedModelId) return [];
    const allowed = new Set(storageIdsByModelId[selectedModelId] ?? []);
    return storages.filter((storage) => allowed.has(storage.id));
  }, [selectedModelId, storageIdsByModelId, storages]);

  const [priceInput, setPriceInput] = useState(
    defaults?.price != null && defaults.price > 0 ? String(defaults.price) : "",
  );
  const priceAmount = useMemo(
    () => parsePriceInput(priceInput).amount,
    [priceInput],
  );
  const fees = useMemo(() => computeFees(priceAmount), [priceAmount]);
  const feePercent = Math.round(BUYER_PROTECTION_FEE_RATE * 100);

  // Resolve guide when model + storage + condition are all set
  const priceGuideEntry = useMemo(() => {
    if (!selectedModelId || !selectedStorageId || !selectedCondition) {
      return null;
    }
    return (
      priceGuideByCombo[
        sellerPriceGuideKey(
          selectedModelId,
          selectedStorageId,
          selectedCondition,
        )
      ] ?? null
    );
  }, [
    priceGuideByCombo,
    selectedModelId,
    selectedStorageId,
    selectedCondition,
  ]);

  return (
    <form
      action={formAction}
      className="grid gap-6 lg:grid-cols-2 lg:items-start"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="iphoneModelId">Modelo</Label>
          <Select
            id="iphoneModelId"
            name="iphoneModelId"
            required
            value={selectedModelId}
            onChange={(event) => {
              const nextModelId = event.target.value;
              setSelectedModelId(nextModelId);
              const allowedColors = new Set(
                colorIdsByModelId[nextModelId] ?? [],
              );
              setSelectedColorId((current) =>
                allowedColors.has(current) ? current : "",
              );
              const allowedStorages = new Set(
                storageIdsByModelId[nextModelId] ?? [],
              );
              setSelectedStorageId((current) =>
                allowedStorages.has(current) ? current : "",
              );
            }}
          >
            <option value="" disabled>
              Selecciona
            </option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="iphoneStorageId">Almacenamiento</Label>
            <Select
              id="iphoneStorageId"
              name="iphoneStorageId"
              required
              disabled={!selectedModelId || availableStorages.length === 0}
              value={selectedStorageId}
              onChange={(event) => setSelectedStorageId(event.target.value)}
            >
              <option value="" disabled>
                {!selectedModelId
                  ? "Elige un modelo primero"
                  : availableStorages.length === 0
                    ? "Sin capacidades para este modelo"
                    : "Selecciona"}
              </option>
              {availableStorages.map((storage) => (
                <option key={storage.id} value={storage.id}>
                  {formatStorageLabel(storage.valueGb)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="iphoneColorId">Color</Label>
            <Select
              id="iphoneColorId"
              name="iphoneColorId"
              required
              disabled={!selectedModelId || availableColors.length === 0}
              value={selectedColorId}
              onChange={(event) => setSelectedColorId(event.target.value)}
            >
              <option value="" disabled>
                {!selectedModelId
                  ? "Elige un modelo primero"
                  : availableColors.length === 0
                    ? "Sin colores para este modelo"
                    : "Selecciona"}
              </option>
              {availableColors.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="condition">Estado</Label>
            <Select
              id="condition"
              name="condition"
              required
              value={selectedCondition}
              onChange={(event) =>
                setSelectedCondition(event.target.value as Condition)
              }
            >
              {(Object.keys(conditionLabels) as Condition[]).map((key) => (
                <option key={key} value={key}>
                  {conditionLabels[key]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="batteryHealth">Salud de batería (%)</Label>
            <Input
              id="batteryHealth"
              name="batteryHealth"
              type="number"
              min={70}
              max={100}
              required
              defaultValue={defaults?.batteryHealth ?? 90}
            />
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Accesorios</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="hasBox"
              defaultChecked={defaults?.hasBox}
              className="size-4 rounded border"
            />
            Caja original
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="hasCharger"
              defaultChecked={defaults?.hasCharger}
              className="size-4 rounded border"
            />
            Cargador
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="hasReceipt"
              defaultChecked={defaults?.hasReceipt}
              className="size-4 rounded border"
            />
            Factura / recibo
          </label>
        </fieldset>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="price">Precio del equipo (COP)</Label>
          <Input
            id="price"
            name="price"
            inputMode="numeric"
            autoComplete="off"
            required
            placeholder="Ej. 2500000"
            value={priceInput}
            onChange={(event) => {
              const next = parsePriceInput(event.target.value);
              setPriceInput(next.display);
            }}
          />
          <p className="text-muted-foreground text-xs">
            Tú recibes el precio completo del equipo. El comprador paga la
            protección TruePhone ({feePercent}%).
          </p>
        </div>

        <SellerPriceGuide entry={priceGuideEntry} />

        <div className="border-border bg-muted/40 space-y-2 rounded-xl border p-4">
          <p className="text-foreground text-sm font-semibold">
            Calculadora de precio
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Precio del equipo</dt>
              <dd className="text-foreground font-medium tabular-nums">
                {priceAmount > 0 ? formatCop(priceAmount) : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">
                Protección TruePhone ({feePercent}%)
                <span className="block text-xs">Pagada por el comprador</span>
              </dt>
              <dd className="text-foreground font-medium tabular-nums">
                {priceAmount > 0 ? formatCop(fees.platformFee) : "—"}
              </dd>
            </div>
            <div className="border-border flex items-baseline justify-between gap-4 border-t pt-2">
              <dt className="text-foreground font-medium">Total comprador</dt>
              <dd className="text-foreground text-base font-semibold tabular-nums">
                {priceAmount > 0 ? formatCop(fees.finalPrice) : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">
                Tú recibes
                <span className="block text-xs">Sin comisión de vendedor</span>
              </dt>
              <dd className="text-foreground font-medium tabular-nums">
                {priceAmount > 0 ? formatCop(priceAmount) : "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={defaults?.description ?? ""}
            placeholder="Cuéntales a los compradores el estado real del equipo."
          />
        </div>
      </div>

      {state?.ok === false ? (
        <p className="text-destructive text-sm lg:col-span-2" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="lg:col-span-2">
        <Button
          type="submit"
          fullWidth
          className="lg:max-w-xs"
          loading={pending}
        >
          Continuar
        </Button>
      </div>
    </form>
  );
}
