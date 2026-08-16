"use client";

/**
 * @file reopen-rejected-listing-button.tsx
 * @description ReopenRejectedListingButton component for the listings feature.tsx.
 * @dependencies next/navigation, react, @/components/ui/button, @/features/listings/actions/listings
 */

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { reopenRejectedListingAction } from "@/features/listings/actions/listings";

type ReopenRejectedListingButtonProps = {
  listingId: string;
};

/**
 * ReopenRejectedListingButton
 *
 * Renders the Reopen Rejected Listing Button UI for listings.
 *
 * @param props - ReopenRejectedListingButton props.
 * @returns ReopenRejectedListingButton React element.
 * @calledBy listings pages and parent components
 */
export function ReopenRejectedListingButton({
  listingId,
}: ReopenRejectedListingButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        fullWidth
        loading={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await reopenRejectedListingAction(listingId);
            if (result && result.ok === false) {
              setError(result.error);
              return;
            }
            if (result?.ok && result.listingId) {
              router.push(`/vender/${result.listingId}/dispositivo`);
            }
          });
        }}
      >
        Editar y reenviar
      </Button>
    </div>
  );
}
