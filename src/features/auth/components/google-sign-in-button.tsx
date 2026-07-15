"use client";

import { useState, useTransition } from "react";

import { signInWithGoogleAction } from "@/features/auth/actions/auth";
import { Button } from "@/components/ui/button";

type GoogleSignInButtonProps = {
  next?: string;
};

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function GoogleSignInButton({ next }: GoogleSignInButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        fullWidth
        loading={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const result = await signInWithGoogleAction(next);
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
