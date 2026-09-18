"use client";

/**
 * @file buyer-hold-waiting.tsx
 * @description Buyer waiting UI with server-driven countdown (F3).
 */

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { createOrderFromHoldAction } from "@/features/availability-hold/actions/availability-hold";
import type { AvailabilityHoldStatus } from "@prisma/client";

type BuyerHoldWaitingProps = {
  holdId: string;
  status: AvailabilityHoldStatus;
  expiresAtIso: string;
  unlockExpiresAtIso: string | null;
  listingTitle: string;
  listingSlug: string;
};

/**
 * formatCountdown
 *
 * Formats remaining ms as HH:MM:SS.
 */
function formatCountdown(ms: number) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/**
 * BuyerHoldWaiting
 *
 * Shows hold status and countdown; enables checkout when CONFIRMED.
 */
export function BuyerHoldWaiting({
  holdId,
  status,
  expiresAtIso,
  unlockExpiresAtIso,
  listingTitle,
  listingSlug,
}: BuyerHoldWaitingProps) {
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const targetIso = status === "CONFIRMED" ? unlockExpiresAtIso : expiresAtIso;
  const remaining = targetIso ? new Date(targetIso).getTime() - now : 0;

  async function onContinue() {
    setError(null);
    setPending(true);
    try {
      const result = await createOrderFromHoldAction(holdId);
      if (!result.ok) {
        setError(result.error ?? "No se pudo continuar.");
      }
    } catch {
      // redirect on success
    } finally {
      setPending(false);
    }
  }

  if (status === "DENIED") {
    return (
      <div className="space-y-4">
        <h1 className="text-foreground text-xl font-semibold">
          Este iPhone ya no está disponible
        </h1>
        <p className="text-muted-foreground text-sm">
          El vendedor indicó que «{listingTitle}» ya no está disponible.
        </p>
        <Button asChild>
          <Link href="/buscar">Explorar anuncios</Link>
        </Button>
      </div>
    );
  }

  if (status === "EXPIRED") {
    return (
      <div className="space-y-4">
        <h1 className="text-foreground text-xl font-semibold">
          Sin respuesta del vendedor
        </h1>
        <p className="text-muted-foreground text-sm">
          El vendedor no confirmó a tiempo. Puedes intentar de nuevo desde el
          anuncio.
        </p>
        <Button asChild variant="outline">
          <Link href={`/anuncios/${listingSlug}`}>Volver al anuncio</Link>
        </Button>
      </div>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <div className="space-y-4">
        <h1 className="text-foreground text-xl font-semibold">
          Disponibilidad confirmada
        </h1>
        <p className="text-muted-foreground text-sm">
          El vendedor confirmó que «{listingTitle}» sigue disponible. Tienes{" "}
          <span className="text-foreground font-mono font-medium tabular-nums">
            {formatCountdown(remaining)}
          </span>{" "}
          para continuar con el pago.
        </p>
        <Button
          type="button"
          loading={pending}
          disabled={remaining <= 0}
          onClick={onContinue}
        >
          Continuar con la compra
        </Button>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-foreground text-xl font-semibold">
        Esperando confirmación del vendedor
      </h1>
      <p className="text-muted-foreground text-sm">
        Le avisamos al vendedor de «{listingTitle}». Antes de cobrarte,
        confirmamos que el iPhone sigue disponible.
      </p>
      <p className="text-foreground font-mono text-2xl font-semibold tabular-nums">
        {formatCountdown(remaining)}
      </p>
      <p className="text-muted-foreground text-xs">
        Si el vendedor no responde a tiempo, podrás intentar de nuevo más tarde.
      </p>
      <Button asChild variant="outline">
        <Link href={`/anuncios/${listingSlug}`}>Volver al anuncio</Link>
      </Button>
    </div>
  );
}
