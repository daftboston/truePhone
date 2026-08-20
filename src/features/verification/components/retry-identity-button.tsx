"use client";

/**
 * @file retry-identity-button.tsx
 * @description Starts a new identity draft after a rejected verification.
 * @dependencies react, startIdentityRetryAction, Button
 */

import { useState, useTransition } from "react";

import { startIdentityRetryAction } from "@/features/verification/actions/identity";
import { Button } from "@/components/ui/button";

/**
 * RetryIdentityButton
 *
 * Creates a blank DRAFT after REJECTED so the seller can resubmit documents.
 *
 * @returns Primary retry CTA with inline error.
 * @calledBy VerificationStartPage rejected state
 */
export function RetryIdentityButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        fullWidth
        loading={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await startIdentityRetryAction();
            if (result && result.ok === false) {
              setError(result.error);
            }
          });
        }}
      >
        Volver a intentar
      </Button>
      {error ? (
        <p className="text-destructive text-center text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
