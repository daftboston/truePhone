"use client";

/**
 * @file delivery-address-fields.tsx
 * @description Reusable Colombia delivery address inputs for checkout and change requests.
 * @dependencies react, colombia-cities, design-system inputs
 */

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CITY_BOGOTA,
  cityOptionNeedsDetail,
  COLOMBIA_CITY_OPTIONS,
  COLOMBIA_DEPARTMENT_OPTIONS,
  DEPARTMENT_BOGOTA_DC,
  resolveCityFormState,
  resolveDepartmentSelectValue,
} from "@/lib/locations/colombia-cities";

export type DeliveryAddressFieldValues = {
  recipientName: string;
  phone: string;
  department: string;
  cityOption: string;
  cityDetail: string;
  addressLine: string;
  notes: string;
};

type DeliveryAddressFieldsProps = {
  idPrefix: string;
  initialValues?: Partial<DeliveryAddressFieldValues>;
  fieldErrors?: Record<string, string[]>;
  disabled?: boolean;
  onValuesChange?: (values: DeliveryAddressFieldValues) => void;
};

/**
 * DeliveryAddressFields
 *
 * Renders recipient, phone, department/city, street, and notes fields.
 *
 * @param props.idPrefix - Prefix for input ids in nested forms.
 * @param props.initialValues - Prefill from profile or order snapshot.
 * @param props.fieldErrors - Server validation messages keyed by field.
 * @param props.disabled - Read-only mode for display-only contexts.
 * @param props.onValuesChange - Optional callback when any field changes.
 * @returns Delivery address form block.
 * @calledBy OrderCheckoutSection, OrderDeliveryAddressPanel
 */
export function DeliveryAddressFields({
  idPrefix,
  initialValues,
  fieldErrors,
  disabled = false,
  onValuesChange,
}: DeliveryAddressFieldsProps) {
  const initialDepartment = resolveDepartmentSelectValue(
    initialValues?.department,
  );
  const initialCity = resolveCityFormState(initialValues?.cityOption);

  const [departmentValue, setDepartmentValue] = useState(initialDepartment);
  const [cityOption, setCityOption] = useState(() => {
    if (initialDepartment === DEPARTMENT_BOGOTA_DC) return CITY_BOGOTA;
    return initialCity.cityOption || initialValues?.cityOption || "";
  });
  const [cityDetail, setCityDetail] = useState(
    initialCity.cityDetail || initialValues?.cityDetail || "",
  );
  const [recipientName, setRecipientName] = useState(
    initialValues?.recipientName ?? "",
  );
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [addressLine, setAddressLine] = useState(
    initialValues?.addressLine ?? "",
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? "");

  const isBogotaDc = departmentValue === DEPARTMENT_BOGOTA_DC;
  const needsCityDetail = useMemo(
    () => !isBogotaDc && cityOptionNeedsDetail(cityOption),
    [cityOption, isBogotaDc],
  );

  /**
   * emitChange
   *
   * Notifies parent with the latest controlled values.
   */
  function emitChange(next: Partial<DeliveryAddressFieldValues>) {
    onValuesChange?.({
      recipientName,
      phone,
      department: departmentValue,
      cityOption: isBogotaDc ? CITY_BOGOTA : cityOption,
      cityDetail,
      addressLine,
      notes,
      ...next,
    });
  }

  /**
   * onDepartmentChange
   *
   * Updates department and resets city when switching into/out of Bogotá D.C.
   */
  function onDepartmentChange(next: string) {
    setDepartmentValue(next);
    if (next === DEPARTMENT_BOGOTA_DC) {
      setCityOption(CITY_BOGOTA);
      setCityDetail("");
      emitChange({ department: next, cityOption: CITY_BOGOTA, cityDetail: "" });
      return;
    }
    if (cityOption === CITY_BOGOTA) {
      setCityOption("");
      emitChange({ department: next, cityOption: "" });
      return;
    }
    emitChange({ department: next });
  }

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-recipientName`}>
          Nombre de quien recibe
        </Label>
        <Input
          id={`${idPrefix}-recipientName`}
          name="recipientName"
          value={recipientName}
          disabled={disabled}
          required
          autoComplete="name"
          aria-invalid={Boolean(fieldErrors?.recipientName?.[0])}
          onChange={(event) => {
            setRecipientName(event.target.value);
            emitChange({ recipientName: event.target.value });
          }}
        />
        {fieldErrors?.recipientName?.[0] ? (
          <p className="text-destructive text-xs" role="alert">
            {fieldErrors.recipientName[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-phone`}>Teléfono de contacto</Label>
        <Input
          id={`${idPrefix}-phone`}
          name="phone"
          value={phone}
          disabled={disabled}
          required
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={Boolean(fieldErrors?.phone?.[0])}
          onChange={(event) => {
            setPhone(event.target.value);
            emitChange({ phone: event.target.value });
          }}
        />
        {fieldErrors?.phone?.[0] ? (
          <p className="text-destructive text-xs" role="alert">
            {fieldErrors.phone[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-department`}>Departamento</Label>
          <Select
            id={`${idPrefix}-department`}
            name="department"
            value={departmentValue}
            disabled={disabled}
            aria-invalid={Boolean(fieldErrors?.department?.[0])}
            onChange={(event) => onDepartmentChange(event.target.value)}
          >
            <option value="">Selecciona el departamento</option>
            {COLOMBIA_DEPARTMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          {fieldErrors?.department?.[0] ? (
            <p className="text-destructive text-xs" role="alert">
              {fieldErrors.department[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-cityOption`}>Ciudad</Label>
          {isBogotaDc ? (
            <>
              <input type="hidden" name="cityOption" value={CITY_BOGOTA} />
              <Input
                id={`${idPrefix}-cityOption`}
                value={CITY_BOGOTA}
                disabled
                readOnly
              />
            </>
          ) : (
            <Select
              id={`${idPrefix}-cityOption`}
              name="cityOption"
              value={cityOption}
              disabled={disabled}
              aria-invalid={Boolean(fieldErrors?.cityOption?.[0])}
              onChange={(event) => {
                setCityOption(event.target.value);
                emitChange({ cityOption: event.target.value });
              }}
            >
              <option value="">Selecciona la ciudad</option>
              {COLOMBIA_CITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          )}
          {fieldErrors?.cityOption?.[0] ? (
            <p className="text-destructive text-xs" role="alert">
              {fieldErrors.cityOption[0]}
            </p>
          ) : null}
        </div>
      </div>

      {needsCityDetail ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-cityDetail`}>Nombre de la ciudad</Label>
          <Input
            id={`${idPrefix}-cityDetail`}
            name="cityDetail"
            value={cityDetail}
            disabled={disabled}
            aria-invalid={Boolean(fieldErrors?.cityDetail?.[0])}
            onChange={(event) => {
              setCityDetail(event.target.value);
              emitChange({ cityDetail: event.target.value });
            }}
          />
          {fieldErrors?.cityDetail?.[0] ? (
            <p className="text-destructive text-xs" role="alert">
              {fieldErrors.cityDetail[0]}
            </p>
          ) : null}
        </div>
      ) : (
        <input type="hidden" name="cityDetail" value={cityDetail} />
      )}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-addressLine`}>
          Dirección y complemento
        </Label>
        <Input
          id={`${idPrefix}-addressLine`}
          name="addressLine"
          value={addressLine}
          disabled={disabled}
          required
          autoComplete="street-address"
          placeholder="Calle, número, barrio, torre/apto"
          aria-invalid={Boolean(fieldErrors?.addressLine?.[0])}
          onChange={(event) => {
            setAddressLine(event.target.value);
            emitChange({ addressLine: event.target.value });
          }}
        />
        {fieldErrors?.addressLine?.[0] ? (
          <p className="text-destructive text-xs" role="alert">
            {fieldErrors.addressLine[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-notes`}>
          Notas para el repartidor (opcional)
        </Label>
        <Textarea
          id={`${idPrefix}-notes`}
          name="notes"
          value={notes}
          disabled={disabled}
          rows={2}
          onChange={(event) => {
            setNotes(event.target.value);
            emitChange({ notes: event.target.value });
          }}
        />
        {fieldErrors?.notes?.[0] ? (
          <p className="text-destructive text-xs" role="alert">
            {fieldErrors.notes[0]}
          </p>
        ) : null}
      </div>
    </div>
  );
}
