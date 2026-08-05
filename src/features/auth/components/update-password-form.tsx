"use client";

/**
 * @file update-password-form.tsx
 * @description Client form for setting a new password after recovery.
 * @dependencies react, updatePasswordAction, design-system inputs
 */

import { useActionState } from "react";

import { updatePasswordAction } from "@/features/auth/actions/auth";
import type { AuthActionState } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * UpdatePasswordForm
 *
 * Collects new password + confirmation and submits to updatePasswordAction.
 *
 * @returns Password update form with field and form-level errors.
 * @calledBy src/app/(auth)/auth/actualizar-contrasena/page.tsx
 */
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
