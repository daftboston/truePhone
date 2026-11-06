"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getBuybackPhotoUrlsAction,
  sendBuybackOfferAction,
  syncBuybackPricesAction,
} from "../actions/buyback";
import type { BuybackQuoteView } from "../types";

export function SyncBuybackPricesButton() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await syncBuybackPricesAction();
            setMessage(
              result.ok
                ? `${result.data.imported} precios importados; ${result.data.issues} filas por revisar.${result.data.skipped ? " Se conservó una importación más reciente." : ""}`
                : result.error,
            );
            if (result.ok) router.refresh();
          })
        }
      >
        {pending ? "Sincronizando…" : "Sincronizar ahora"}
      </Button>
      <p role="status" className="text-muted-foreground text-sm">
        {message}
      </p>
    </div>
  );
}
export function BuybackReviewerControls({
  quote,
}: {
  quote: BuybackQuoteView;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<{ slot: number; url: string }[]>([]);
  const router = useRouter();
  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await getBuybackPhotoUrlsAction(quote.id);
            if (result.ok) {
              setPhotos(result.data);
              setMessage("Enlaces privados válidos durante cinco minutos.");
            } else setMessage(result.error);
          })
        }
      >
        Ver fotos privadas
      </Button>
      {photos.length ? (
        <ul className="flex flex-wrap gap-3">
          {photos.map((photo) => (
            <li key={photo.slot}>
              <a
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary text-sm underline"
              >
                Abrir foto {photo.slot + 1}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        action={(form) =>
          start(async () => {
            const result = await sendBuybackOfferAction({
              quoteId: quote.id,
              expectedVersion: quote.version,
              amountCop: Number(form.get("amountCop")),
            });
            setMessage(
              result.ok
                ? "Oferta enviada. El vendedor debe aceptar esta versión; aún no confirma recogida ni pago."
                : result.error,
            );
            if (result.ok || (!result.ok && result.code === "QUOTE_CHANGED"))
              router.refresh();
          })
        }
      >
        <div className="space-y-1">
          <Label htmlFor={`amount-${quote.id}`}>Oferta firme (COP)</Label>
          <Input
            id={`amount-${quote.id}`}
            name="amountCop"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={quote.offer?.amountCop}
          />
        </div>
        <Button disabled={pending} type="submit">
          {pending
            ? "Enviando…"
            : quote.offer
              ? "Enviar nueva oferta"
              : "Enviar oferta"}
        </Button>
      </form>
      <p className="text-muted-foreground text-xs">
        Enviar una nueva oferta invalida la anterior y exige una nueva
        aceptación.
      </p>
      <p role="status" className="text-sm">
        {message}
      </p>
    </div>
  );
}
