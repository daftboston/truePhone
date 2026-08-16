"use client";

/**
 * @file change-password-form.tsx
 * @description Client form for changing password while logged in.
 * @dependencies react, changePasswordAction, design-system inputs
 */

import { useActionState } from "react";

import { changePasswordAction } from "@/features/profile/actions/profile";
import type { ProfileActionState } from "@/features/profile/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * ChangePasswordForm
 *
 * Collects new password + confirmation and submits to changePasswordAction.
 *
 * @returns Password form with field errors and success/error status.
 * @calledBy profile edit page
 */
export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<
    ProfileActionState,
    FormData
  >(changePasswordAction, null);

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
