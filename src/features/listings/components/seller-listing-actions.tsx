"use client";

/**
 * @file seller-listing-actions.tsx
 * @description Acciones menu for a seller hub listing row (Ver, Archivar, Relistar).
 * @dependencies react, next/link, lucide-react, archive/relist actions, Button
 */

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  archiveListingAction,
  relistListingAction,
} from "@/features/listings/actions/listings";
import { cn } from "@/lib/utils";

type SellerListingActionsProps = {
  listingId: string;
  viewHref: string;
  continueHref?: string;
  reasonHref?: string;
  orderHref?: string;
  canArchive: boolean;
  canRelist: boolean;
};

/**
 * SellerListingActions
 *
 * Renders a compact Acciones disclosure with view links and archive/relist
 * server actions. Confirms archive before submitting.
 *
 * @param props.listingId - Listing UUID for archive/relist actions.
 * @param props.viewHref - Ver destination (public or seller detail).
 * @param props.continueHref - Optional draft resume path.
 * @param props.reasonHref - Optional rejected-listing detail path.
 * @param props.orderHref - Optional related order path.
 * @param props.canArchive - When true, shows Archivar.
 * @param props.canRelist - When true, shows Relistar.
 * @returns Acciones menu for SellerListingRow.
 * @calledBy SellerListingRow
 */
export function SellerListingActions({
  listingId,
  viewHref,
  continueHref,
  reasonHref,
  orderHref,
  canArchive,
  canRelist,
}: SellerListingActionsProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    /**
     * Closes the menu on outside pointer or Escape.
     */
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /**
   * runAction
   *
   * Confirms when needed, then runs archive or relist and surfaces errors.
   *
   * @param kind - Archive or relist.
   * @returns void
   */
  function runAction(kind: "archive" | "relist") {
    if (kind === "archive") {
      const confirmed = window.confirm(
        "El anuncio dejará de verse en el marketplace. Puedes relistarlo después.",
      );
      if (!confirmed) return;
    }

    setError(null);
    setOpen(false);
    startTransition(async () => {
      const result =
        kind === "archive"
          ? await archiveListingAction(listingId)
          : await relistListingAction(listingId);
      if (result && result.ok === false) {
        setError(result.error);
      }
    });
  }

  const itemClassName =
    "block w-full rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted";

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-w-[7.5rem] justify-between"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={pending}
        loading={pending}
        onClick={() => setOpen((current) => !current)}
      >
        Acciones
        <ChevronDown className="size-4" aria-hidden />
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="border-border bg-background absolute right-0 z-20 mt-1 w-48 rounded-lg border p-1 shadow-md"
        >
          <Link
            href={viewHref}
            role="menuitem"
            className={itemClassName}
            onClick={() => setOpen(false)}
          >
            Ver
          </Link>
          {continueHref ? (
            <Link
              href={continueHref}
              role="menuitem"
              className={itemClassName}
              onClick={() => setOpen(false)}
            >
              Continuar
            </Link>
          ) : null}
          {reasonHref ? (
            <Link
              href={reasonHref}
              role="menuitem"
              className={itemClassName}
              onClick={() => setOpen(false)}
            >
              Ver motivo
            </Link>
          ) : null}
          {orderHref ? (
            <Link
              href={orderHref}
              role="menuitem"
              className={itemClassName}
              onClick={() => setOpen(false)}
            >
              Ver pedido
            </Link>
          ) : null}
          {canArchive ? (
            <button
              type="button"
              role="menuitem"
              className={itemClassName}
              onClick={() => runAction("archive")}
            >
              Archivar
            </button>
          ) : null}
          {canRelist ? (
            <button
              type="button"
              role="menuitem"
              className={cn(itemClassName, "font-medium")}
              onClick={() => runAction("relist")}
            >
              Relistar
            </button>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p className="text-destructive mt-1 text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
