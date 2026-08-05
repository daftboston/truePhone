"use client";

/**
 * @file create-order-button.tsx
 * @description CreateOrderButton component for the orders feature.tsx.
 * @dependencies next/navigation, react, next/dist/client/components/redirect-error, @/components/ui/button, @/features/orders/actions/orders
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
};

/**
 * CreateOrderButton
 *
 * Renders the Create Order Button UI for orders.
 *
 * @param props - CreateOrderButton props.
 * @returns CreateOrderButton React element.
 * @calledBy orders pages and parent components
 */
export function CreateOrderButton({
  listingId,
  loginHref,
  fullWidth = false,
  label = "Comprar",
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
    </div>
  );
}
