"use client";

/**
 * @file browse-filters-sheet.tsx
 * @description Mobile sheet for browse filters; desktop shows the sidebar.
 * @dependencies react, lucide-react, Button
 */

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type BrowseFiltersSheetProps = {
  children: React.ReactNode;
};

/**
 * BrowseFiltersSheet
 *
 * Collapses browse filters into a «Filtros» sheet on small screens.
 * Callers pass a `key` derived from the active search params so applying a
 * filter remounts the sheet closed instead of leaving it open over results.
 *
 * @param props.children - BrowseFilters aside.
 * @returns Mobile sheet + desktop sidebar.
 * @calledBy SearchPage
 */
export function BrowseFiltersSheet({ children }: BrowseFiltersSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => setOpen(true)}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filtros
        </Button>
      </div>

      {open ? (
        <div className="md:hidden">
          <button
            type="button"
            className="bg-foreground/40 fixed inset-0 z-50"
            aria-label="Cerrar filtros"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            className="bg-background border-border fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t p-4 pb-24 shadow-lg"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-foreground text-sm font-semibold">Filtros</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Cerrar"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
            {children}
          </div>
        </div>
      ) : null}

      <div className="hidden md:block">{children}</div>
    </>
  );
}
