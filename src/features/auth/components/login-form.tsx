"use client";

/**
 * @file login-form.tsx
 * @description Client form for email/password login with Google OAuth and confirmation resend.
 * @dependencies loginAction, resendConfirmationAction, GoogleSignInButton, design-system inputs
 */

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import {
  loginAction,
  resendConfirmationAction,
} from "@/features/auth/actions/auth";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import type { AuthActionState } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  next?: string;
};

/**
 * LoginForm
 *
 * Collects credentials, submits to loginAction, and offers resend when email is unconfirmed.
 *
 * @param props.next - Optional post-login redirect path passed as a hidden field.
 * @returns Login UI with Google button, email form, and conditional resend form.
 * @calledBy src/app/(auth)/login/page.tsx
 */
export function LoginForm({ next }: LoginFormProps) {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(loginAction, null);
  const [resendState, resendAction, resendPending] = useActionState<
    AuthActionState,
    FormData
  >(resendConfirmationAction, null);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Detect unconfirmed-email error to reveal the resend confirmation form
  const needsConfirmation =
    state?.ok === false &&
    state.error.toLowerCase().includes("confirma tu correo");

  return (
    <div className="space-y-5">
      <GoogleSignInButton next={next} />

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
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@correo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {state?.ok === false && state.fieldErrors?.email?.[0] ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.email[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              href="/recuperar"
              className="text-primary text-xs font-medium hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="pr-11"
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 transition-colors"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {state?.ok === false && state.fieldErrors?.password?.[0] ? (
            <p className="text-destructive text-xs">
              {state.fieldErrors.password[0]}
            </p>
          ) : null}
        </div>

        {state?.ok === false ? (
          <p className="text-destructive text-sm" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" fullWidth loading={pending}>
          Iniciar sesión
        </Button>
      </form>

      {needsConfirmation ? (
        <form action={resendAction} className="space-y-2">
          <input type="hidden" name="email" value={email} />
          <Button
            type="submit"
            variant="outline"
            fullWidth
            loading={resendPending}
          >
            Reenviar correo de confirmación
          </Button>
          {resendState?.ok === true ? (
            <p className="text-success text-xs" role="status">
              {resendState.message}
            </p>
          ) : null}
          {resendState?.ok === false ? (
            <p className="text-destructive text-xs" role="alert">
              {resendState.error}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
