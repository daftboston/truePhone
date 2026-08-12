/**
 * @file delete-recommended-price-button.tsx
 * @description Admin control to delete a recommended price row.
 * @dependencies react, deleteRecommendedPriceAction
 */

"use client";

import { useActionState } from "react";

import { deleteRecommendedPriceAction } from "@/features/recommended-prices/actions/recommended-prices";
import type { RecommendedPriceActionState } from "@/features/recommended-prices/types";
import { Button } from "@/components/ui/button";

type DeleteRecommendedPriceButtonProps = {
  id: string;
  label: string;
};

/**
 * DeleteRecommendedPriceButton
 *
 * Confirms and deletes a recommended price guide row.
 *
 * @param props.id - RecommendedPrice id.
 * @param props.label - Accessible description of the combo being deleted.
 * @returns Delete form button.
 * @calledBy AdminRecommendedPricesPage
 */
export function DeleteRecommendedPriceButton({
  id,
  label,
}: DeleteRecommendedPriceButtonProps) {
  const [state, formAction, pending] = useActionState<
    RecommendedPriceActionState,
    FormData
  >(deleteRecommendedPriceAction, null);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `¿Eliminar el precio de referencia para ${label}? Esta acción no se puede deshacer.`,
          )
        ) {
          event.preventDefault();
        }
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={pending}
        aria-label={`Eliminar precio de ${label}`}
      >
        {pending ? "Eliminando…" : "Eliminar"}
      </Button>
      {state?.ok === false ? (
        <p className="text-destructive mt-1 text-xs" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
