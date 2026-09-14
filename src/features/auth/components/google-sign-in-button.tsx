"use client";

/**
 * @file google-sign-in-button.tsx
 * @description Client button that starts Google OAuth via signInWithGoogleAction.
 * @dependencies react, signInWithGoogleAction, Button
 * @changelog 2026-09-14 — Blocks OAuth on register until legal acceptance is checked.
 */

import { useState, useTransition } from "react";

import { signInWithGoogleAction } from "@/features/auth/actions/auth";
import { Button } from "@/components/ui/button";

type GoogleSignInButtonProps = {
  next?: string;
  /** When true on register, sets signup acceptance cookie before OAuth redirect. */
  signupLegalAccepted?: boolean;
};

/**
 * isNextRedirectError
 *
 * Detects Next.js redirect throws so they are not shown as UI errors.
 *
 * @param error - Caught exception from the OAuth action.
 * @returns True when the digest indicates a NEXT_REDIRECT.
 * @calledBy GoogleSignInButton
 */
function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

/**
 * GoogleSignInButton
 *
 * Triggers Google OAuth and surfaces non-redirect failures inline.
 *
 * @param props.next - Optional post-login path forwarded to the auth callback.
 * @param props.signupLegalAccepted - Register flow: must be true to start OAuth.
 * @returns Outline button with optional error alert.
 * @calledBy LoginForm, RegisterForm
 */
export function GoogleSignInButton({
  next,
  signupLegalAccepted,
}: GoogleSignInButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const requiresSignupAcceptance = signupLegalAccepted !== undefined;
  const blocked = requiresSignupAcceptance && signupLegalAccepted !== true;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        fullWidth
        loading={pending}
        disabled={blocked}
        onClick={() => {
          if (blocked) {
            setError("Debes aceptar los Términos y la Política de Privacidad.");
            return;
          }

          setError(null);
          startTransition(async () => {
            try {
              const result = await signInWithGoogleAction(next, {
                recordSignupLegalAcceptance: signupLegalAccepted === true,
              });
              if (result && !result.ok) {
                setError(result.error);
              }
            } catch (err) {
              if (!isNextRedirectError(err)) {
                setError("No pudimos conectar con Google. Intenta de nuevo.");
              }
            }
          });
        }}
      >
        Continuar con Google
      </Button>
      {error ? (
        <p className="text-destructive text-center text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
