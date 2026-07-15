"use client";

import { useActionState } from "react";

import { updatePasswordAction } from "@/features/auth/actions/auth";
import type { AuthActionState } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(updatePasswordAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {state?.ok === false && state.fieldErrors?.password?.[0] ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {state?.ok === false && state.fieldErrors?.confirmPassword?.[0] ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.confirmPassword[0]}
          </p>
        ) : null}
      </div>

      {state?.ok === false ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" fullWidth loading={pending}>
        Guardar contraseña
      </Button>
    </form>
  );
}
