"use client";

import { useActionState } from "react";

import { updateProfileAction } from "@/features/profile/actions/profile";
import type { ProfileActionState } from "@/features/profile/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProfileEditFormProps = {
  fullName: string | null;
  username: string | null;
  city: string | null;
  department: string | null;
  bio: string | null;
  phone: string | null;
};

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            name="city"
            defaultValue={city ?? ""}
            placeholder="Bogotá"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Departamento</Label>
          <Input
            id="department"
            name="department"
            defaultValue={department ?? ""}
            placeholder="Cundinamarca"
          />
        </div>
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
