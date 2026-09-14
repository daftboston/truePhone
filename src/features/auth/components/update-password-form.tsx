"use client";

/**
 * @file update-password-form.tsx
 * @description Client form for setting a new password after recovery.
 * @dependencies react, updatePasswordAction, PasswordField, design-system inputs
 * @changelog 2026-09-11 — Shared PasswordField for visibility toggles.
 */

import { useActionState } from "react";

import { updatePasswordAction } from "@/features/auth/actions/auth";
import type { AuthActionState } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";

/**
 * UpdatePasswordForm
 *
 * Collects new password + confirmation and submits to updatePasswordAction.
 *
 * @returns Password update form with field and form-level errors.
 * @calledBy src/app/auth/actualizar-contrasena/page.tsx
 */
export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(updatePasswordAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <PasswordField
        id="password"
        name="password"
        label="Nueva contraseña"
        error={
          state?.ok === false ? state.fieldErrors?.password?.[0] : undefined
        }
      />

      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmar contraseña"
        error={
          state?.ok === false
            ? state.fieldErrors?.confirmPassword?.[0]
            : undefined
        }
      />

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
