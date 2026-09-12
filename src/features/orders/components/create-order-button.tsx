"use client";

/**
 * @file create-order-button.tsx
 * @description Buy CTA that creates a reserved order; optional 24h settlement disclosure.
 * @dependencies next/navigation, react, Button, createOrderAction
 */

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { Button } from "@/components/ui/button";
import { createOrderAction } from "@/features/orders/actions/orders";

type CreateOrderButtonProps = {
  listingId: string;
  loginHref: string;
  fullWidth?: boolean;
  label?: string;
  /** `fee` is a short hold line; `none` is the button only. */
  disclosure?: "fee" | "none";
};

/**
 * CreateOrderButton
 *
 * Renders the buy CTA that creates a reserved order for Guaranteed Purchase.
 *
 * @param props.listingId - Listing to reserve and purchase.
 * @param props.loginHref - Redirect when the buyer must sign in.
 * @param props.fullWidth - Stretch the button to the container width.
 * @param props.label - Button label (default «Comprar»).
 * @param props.disclosure - Helper copy under the button.
 * @returns CreateOrderButton React element.
 * @calledBy Listing detail (`/anuncios/[slug]`)
 */
export function CreateOrderButton({
  listingId,
  loginHref,
  fullWidth = false,
  label = "Comprar",
  disclosure = "none",
}: CreateOrderButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onBuy() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createOrderAction(listingId);
        if (result && !result.ok) {
          if (result.loginRequired) {
            router.push(loginHref);
            return;
          }
          setError(result.error);
        }
      } catch (error) {
        if (isRedirectError(error)) throw error;
        setError("No se pudo crear el pedido. Intenta de nuevo.");
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        fullWidth={fullWidth}
        loading={pending}
        onClick={onBuy}
      >
        {label}
      </Button>
      {error ? (
        <p className="text-destructive text-center text-xs" role="alert">
          {error}
        </p>
      ) : null}
      {disclosure === "fee" ? (
        <p className="text-muted-foreground text-center text-xs">
          Sin envío en este cobro. Retención 24h tras «Ya recibí».
        </p>
      ) : null}
    </div>
  );
}
