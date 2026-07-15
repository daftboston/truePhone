"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

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
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
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
