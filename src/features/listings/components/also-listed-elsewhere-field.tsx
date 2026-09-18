"use client";

/**
 * @file also-listed-elsewhere-field.tsx
 * @description Sell wizard field + mandatory Lawyer modal for multi-platform disclosure (F3).
 */

import { useState } from "react";

import { Button } from "@/components/ui/button";

const MODAL_TITLE = "Publicado también fuera de TruePhone";

const MODAL_BODY = `Si marcas que este iPhone también está en otras plataformas (por ejemplo Facebook, Mercado Libre u otra tienda):

1. En el anuncio de TruePhone se mostrará un aviso visible para el comprador, para protegerlo de compras sobre un equipo que podría venderse en otro lado.
2. Antes de cobrar al comprador, TruePhone te pedirá confirmar que el iPhone sigue disponible.
3. Si indicas que ya no está disponible, no se cobrará al comprador y el anuncio podrá pausarse o archivarse. Si no confirmas a tiempo, no se cobrará al comprador y el anuncio puede seguir publicado.

Si vendes el equipo en otra plataforma, baja o pausa este anuncio en TruePhone lo antes posible para evitar una doble venta. Gracias por ayudar a proteger a compradores y vendedores.`;

const CHECKBOX_LABEL =
  "Entiendo que el aviso se verá en mi anuncio y que debo confirmar disponibilidad antes del pago.";

type AlsoListedElsewhereFieldProps = {
  defaultValue?: boolean;
};

/**
 * AlsoListedElsewhereField
 *
 * Yes/no disclosure with mandatory modal when selecting yes.
 */
export function AlsoListedElsewhereField({
  defaultValue = false,
}: AlsoListedElsewhereFieldProps) {
  const [selection, setSelection] = useState<"yes" | "no" | null>(
    defaultValue ? "yes" : "no",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(defaultValue);

  function selectNo() {
    setSelection("no");
    setAcknowledged(false);
    setModalOpen(false);
  }

  function trySelectYes() {
    if (acknowledged) {
      setSelection("yes");
      return;
    }
    setModalOpen(true);
  }

  function confirmYes() {
    setAcknowledged(true);
    setSelection("yes");
    setModalOpen(false);
  }

  const alsoListed = selection === "yes" && acknowledged;

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">
        ¿También publicaste este iPhone en otras plataformas?
      </legend>
      <p className="text-muted-foreground text-xs">
        Por ejemplo Facebook, Mercado Libre u otra tienda. Esto ayuda a proteger
        a los compradores.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={selection === "no" ? "default" : "outline"}
          size="sm"
          onClick={selectNo}
        >
          No
        </Button>
        <Button
          type="button"
          variant={selection === "yes" ? "default" : "outline"}
          size="sm"
          onClick={trySelectYes}
        >
          Sí
        </Button>
      </div>

      <input
        type="hidden"
        name="alsoListedElsewhere"
        value={alsoListed ? "true" : "false"}
      />
      {alsoListed ? (
        <input type="hidden" name="alsoListedAcknowledged" value="true" />
      ) : null}

      {modalOpen ? (
        <div>
          <button
            type="button"
            className="bg-foreground/40 fixed inset-0 z-50"
            aria-label="Cerrar"
            onClick={() => setModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="also-listed-modal-title"
            className="bg-background border-border fixed inset-x-4 top-[10%] z-50 mx-auto max-w-lg rounded-2xl border p-5 shadow-lg md:inset-x-auto"
          >
            <h2
              id="also-listed-modal-title"
              className="text-foreground text-lg font-semibold"
            >
              {MODAL_TITLE}
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed whitespace-pre-line">
              {MODAL_BODY}
            </p>
            <label className="mt-4 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              <span>{CHECKBOX_LABEL}</span>
            </label>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={!acknowledged}
                onClick={confirmYes}
              >
                Guardar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}
