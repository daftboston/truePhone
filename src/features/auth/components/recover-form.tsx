"use client";

import { useActionState } from "react";

import { recoverAction } from "@/features/auth/actions/auth";
import type { AuthActionState } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RecoverForm() {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(recoverAction, null);

  if (state?.ok === true) {
    return (
      <div className="space-y-3 text-center" role="status">
        <p className="text-foreground text-sm font-medium">Revisa tu correo</p>
        <p className="text-muted-foreground text-sm">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@correo.com"
        />
        {state?.ok === false && state.fieldErrors?.email?.[0] ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      {state?.ok === false ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" fullWidth loading={pending}>
        Enviar enlace
      </Button>
    </form>
  );
}
