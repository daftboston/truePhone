"use client";

/**
 * @file change-password-form.tsx
 * @description Client form for changing password while logged in.
 * @dependencies react, changePasswordAction, PasswordField, design-system inputs
 * @changelog 2026-09-11 — Shared PasswordField with show/hide toggles.
 */

import { useActionState } from "react";

import { changePasswordAction } from "@/features/profile/actions/profile";
import type { ProfileActionState } from "@/features/profile/types";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";

/**
 * ChangePasswordForm
 *
 * Collects new password + confirmation and submits to changePasswordAction.
 *
 * @returns Password form with field errors and success/error status.
 * @calledBy ProfileSecurityPage
 */
export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<
    ProfileActionState,
    FormData
  >(changePasswordAction, null);

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

      {state?.ok === true ? (
        <p className="text-success text-sm" role="status">
          {state.message}
        </p>
      ) : null}
      {state?.ok === false ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant="outline" fullWidth loading={pending}>
        Actualizar contraseña
      </Button>
    </form>
  );
}
