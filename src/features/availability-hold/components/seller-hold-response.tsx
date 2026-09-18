"use client";

/**
 * @file seller-hold-response.tsx
 * @description Seller confirm/deny UI for availability holds (F3).
 */

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  confirmAvailabilityHoldAction,
  denyAvailabilityHoldAction,
} from "@/features/availability-hold/actions/availability-hold";

type SellerHoldResponseProps = {
  holdId: string;
  listingTitle: string;
  buyerName: string;
  expiresAtIso: string;
};

/**
 * SellerHoldResponse
 *
 * Lets the seller confirm or deny availability within the 2h window.
 */
export function SellerHoldResponse({
  holdId,
  listingTitle,
  buyerName,
  expiresAtIso,
}: SellerHoldResponseProps) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const expiresAt = new Date(expiresAtIso).getTime();
    const tick = () => setExpired(Date.now() > expiresAt);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAtIso]);

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmAvailabilityHoldAction(holdId);
      if (result.ok) {
        setMessage(
          "Confirmaste que el iPhone sigue disponible. El comprador puede pagar.",
        );
      } else {
        setError(result.error ?? "No se pudo confirmar.");
      }
    });
  }

  function onDeny() {
    setError(null);
    startTransition(async () => {
      const result = await denyAvailabilityHoldAction(holdId);
      if (result.ok) {
        setMessage(
          "Indicaste que el iPhone ya no está disponible. El anuncio quedó archivado.",
        );
      } else {
        setError(result.error ?? "No se pudo registrar la respuesta.");
      }
    });
  }

  if (message) {
    return (
      <p className="text-foreground text-sm" role="status">
        {message}
      </p>
    );
  }

  if (expired) {
    return (
      <p className="text-muted-foreground text-sm">
        El plazo para responder esta solicitud ya venció.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        {buyerName} quiere comprar «{listingTitle}». ¿El iPhone sigue
        disponible?
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" loading={pending} onClick={onConfirm}>
          Sí, sigue disponible
        </Button>
        <Button
          type="button"
          variant="outline"
          loading={pending}
          onClick={onDeny}
        >
          No, ya no está disponible
        </Button>
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
