"use client";

/**
 * @file register-form.tsx
 * @description Client form for email/password registration with Google OAuth option.
 * @dependencies react, registerAction, GoogleSignInButton, design-system inputs
 */

import { useActionState } from "react";

import { registerAction } from "@/features/auth/actions/auth";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import type { AuthActionState } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * RegisterForm
 *
 * Collects signup fields and submits to registerAction.
 *
 * @returns Registration UI, or a check-email success message after signup.
 * @calledBy src/app/(auth)/register/page.tsx
 */
export function RegisterForm() {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(registerAction, null);

  if (state?.ok === true) {
    return (
      <div className="space-y-3 text-center" role="status">
        <p className="text-foreground text-sm font-medium">Revisa tu correo</p>
        <p className="text-muted-foreground text-sm">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <GoogleSignInButton next="/perfil" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="border-border w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card text-muted-foreground px-2">
            o con tu correo
          </span>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            placeholder="Tu nombre"
          />
          {state?.ok === false && state.fieldErrors?.fullName?.[0] ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.fullName[0]}
            </p>
          ) : null}
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
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
          Crear cuenta
        </Button>
      </form>
    </div>
  );
}
