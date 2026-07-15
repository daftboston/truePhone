"use client";

import { useActionState } from "react";
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
import { conditionLabels } from "@/features/listings/schemas/listing";
import type { ListingActionState } from "@/features/listings/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { computeFees } from "@/features/listings/schemas/listing";
import { useMemo, useState } from "react";

type DeviceFormProps = {
  models: IphoneModel[];
  colors: IphoneColor[];
  storages: IphoneStorage[];
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

export function DeviceDetailsForm({
  models,
  colors,
  storages,
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

  const [price, setPrice] = useState(defaults?.price ?? 2_500_000);
  const fees = useMemo(() => computeFees(price || 0), [price]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="iphoneModelId">Modelo</Label>
        <Select
          id="iphoneModelId"
          name="iphoneModelId"
          required
          defaultValue={defaults?.iphoneModelId ?? ""}
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
            defaultValue={defaults?.iphoneStorageId ?? ""}
          >
            <option value="" disabled>
              Selecciona
            </option>
            {storages.map((storage) => (
              <option key={storage.id} value={storage.id}>
                {storage.valueGb} GB
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
            defaultValue={defaults?.iphoneColorId ?? ""}
          >
            <option value="" disabled>
              Selecciona
            </option>
            {colors.map((color) => (
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
            defaultValue={defaults?.condition ?? "EXCELLENT"}
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

      <div className="space-y-2">
        <Label htmlFor="price">Precio del equipo (COP)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          min={100000}
          step={1000}
          required
          value={price}
          onChange={(event) => setPrice(Number(event.target.value))}
        />
        <p className="text-muted-foreground text-xs">
          Protección al comprador (6%): $
          {fees.platformFee.toLocaleString("es-CO")} · Total comprador: $
          {fees.finalPrice.toLocaleString("es-CO")}
        </p>
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

      {state?.ok === false ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" fullWidth loading={pending}>
        Continuar
      </Button>
    </form>
  );
}
