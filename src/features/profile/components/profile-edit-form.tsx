"use client";

/**
 * @file profile-edit-form.tsx
 * @description Client form for editing name, username, Colombia location, phone, and bio.
 * @dependencies react, updateProfileAction, colombia-cities, design-system inputs
 */

import { useActionState, useMemo, useState } from "react";

import { updateProfileAction } from "@/features/profile/actions/profile";
import type { ProfileActionState } from "@/features/profile/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CITY_BOGOTA,
  CITY_BOGOTA_SURROUNDINGS,
  CITY_OTHER,
  cityOptionNeedsDetail,
  COLOMBIA_CITY_OPTIONS,
  COLOMBIA_DEPARTMENT_OPTIONS,
  DEPARTMENT_BOGOTA_DC,
  resolveCityFormState,
  resolveDepartmentSelectValue,
} from "@/lib/locations/colombia-cities";

type ProfileEditFormProps = {
  fullName: string | null;
  username: string | null;
  city: string | null;
  department: string | null;
  bio: string | null;
  phone: string | null;
};

/**
 * ProfileEditForm
 *
 * Submits profile fields to updateProfileAction with cascading department/city UI.
 *
 * @param props - Current profile values used as controlled/default form state.
 * @returns Profile edit form with validation errors.
 * @calledBy profile edit page
 */
export function ProfileEditForm({
  fullName,
  username,
  city,
  department,
  bio,
  phone,
}: ProfileEditFormProps) {
  const [state, formAction, pending] = useActionState<
    ProfileActionState,
    FormData
  >(updateProfileAction, null);

  const initialDepartment = resolveDepartmentSelectValue(department);
  const initialCity = resolveCityFormState(city);

  const [departmentValue, setDepartmentValue] = useState(initialDepartment);
  const [cityOption, setCityOption] = useState(() => {
    if (initialDepartment === DEPARTMENT_BOGOTA_DC) return CITY_BOGOTA;
    return initialCity.cityOption;
  });
  const [cityDetail, setCityDetail] = useState(initialCity.cityDetail);

  const isBogotaDc = departmentValue === DEPARTMENT_BOGOTA_DC;
  const needsCityDetail = useMemo(
    () => !isBogotaDc && cityOptionNeedsDetail(cityOption),
    [cityOption, isBogotaDc],
  );

  /**
   * onDepartmentChange
   *
   * Updates department and resets city when switching into/out of Bogotá D.C.
   *
   * @param next - Selected department option value.
   */
  function onDepartmentChange(next: string) {
    setDepartmentValue(next);
    if (next === DEPARTMENT_BOGOTA_DC) {
      setCityOption(CITY_BOGOTA);
      setCityDetail("");
    } else if (cityOption === CITY_BOGOTA) {
      // Leaving Bogotá D.C. — clear auto-forced city so user picks again.
      setCityOption("");
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={fullName ?? ""}
          required
          autoComplete="name"
        />
        {state?.ok === false && state.fieldErrors?.fullName?.[0] ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.fullName[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Usuario público</Label>
        <Input
          id="username"
          name="username"
          defaultValue={username ?? ""}
          placeholder="ej. ricardo_m"
          autoComplete="username"
        />
        <p className="text-muted-foreground text-xs">
          Se usa en tu enlace público: truephone.co/u/usuario
        </p>
        {state?.ok === false && state.fieldErrors?.username?.[0] ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.username[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="department">Departamento</Label>
          <Select
            id="department"
            name="department"
            value={departmentValue}
            disabled={pending}
            onChange={(e) => onDepartmentChange(e.target.value)}
          >
            <option value="">Selecciona tu departamento</option>
            {COLOMBIA_DEPARTMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          {state?.ok === false && state.fieldErrors?.department?.[0] ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.department[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cityOption">Ciudad</Label>
          {isBogotaDc ? (
            <>
              <input type="hidden" name="cityOption" value={CITY_BOGOTA} />
              <Input
                id="cityOption"
                value={CITY_BOGOTA}
                disabled
                readOnly
                aria-readonly
              />
              <p className="text-muted-foreground text-xs">
                En Bogotá D.C. la ciudad queda en Bogotá. TruePhone Premium
                aplica aquí.
              </p>
            </>
          ) : (
            <>
              <Select
                id="cityOption"
                name="cityOption"
                value={cityOption}
                disabled={pending}
                onChange={(e) => {
                  setCityOption(e.target.value);
                  if (!cityOptionNeedsDetail(e.target.value)) {
                    setCityDetail("");
                  }
                }}
              >
                <option value="">Selecciona tu ciudad</option>
                {COLOMBIA_CITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
              <p className="text-muted-foreground text-xs">
                TruePhone Premium solo aplica en Bogotá (departamento Bogotá
                D.C.).
              </p>
            </>
          )}
          {state?.ok === false && state.fieldErrors?.cityOption?.[0] ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.cityOption[0]}
            </p>
          ) : null}
        </div>

        {needsCityDetail ? (
          <div className="space-y-2">
            <Label htmlFor="cityDetail">
              {cityOption === CITY_BOGOTA_SURROUNDINGS
                ? "Municipio o zona"
                : "Nombre de la ciudad"}
            </Label>
            <Input
              id="cityDetail"
              name="cityDetail"
              value={cityDetail}
              onChange={(e) => setCityDetail(e.target.value)}
              required
              maxLength={80}
              disabled={pending}
              placeholder={
                cityOption === CITY_BOGOTA_SURROUNDINGS
                  ? "Ej. Soacha, Chía, La Calera"
                  : cityOption === CITY_OTHER
                    ? "Escribe tu ciudad"
                    : ""
              }
            />
            {state?.ok === false && state.fieldErrors?.cityDetail?.[0] ? (
              <p className="text-destructive text-xs">
                {state.fieldErrors.cityDetail[0]}
              </p>
            ) : null}
          </div>
        ) : (
          <input type="hidden" name="cityDetail" value="" />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone ?? ""}
          placeholder="300 123 4567"
          autoComplete="tel"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Biografía</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={bio ?? ""}
          maxLength={280}
          placeholder="Cuéntales a los compradores quién eres."
        />
        {state?.ok === false && state.fieldErrors?.bio?.[0] ? (
          <p className="text-destructive text-xs">{state.fieldErrors.bio[0]}</p>
        ) : null}
      </div>

      {state?.ok === false ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" fullWidth loading={pending}>
        Guardar cambios
      </Button>
    </form>
  );
}
