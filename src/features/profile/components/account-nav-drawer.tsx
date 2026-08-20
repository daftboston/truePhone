"use client";

/**
 * @file account-nav-drawer.tsx
 * @description Mobile drawer for Mi TruePhone; desktop keeps the sidebar.
 * @dependencies react, next/navigation, lucide-react, Button
 */

import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type AccountNavDrawerProps = {
  children: React.ReactNode;
};

/**
 * AccountNavDrawer
 *
 * On small screens, hides the account sidebar behind «Mi TruePhone».
 * Desktop renders the same nav in place.
 *
 * @param props.children - AccountNav.
 * @returns Responsive account navigation chrome.
 * @calledBy AuthenticatedSidebarShell
 */
export function AccountNavDrawer({ children }: AccountNavDrawerProps) {
  const [openedAtPath, setOpenedAtPath] = useState<string | null>(null);
  const pathname = usePathname();
  const titleId = useId();
  const open = openedAtPath === pathname;

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <div className="md:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => setOpenedAtPath(pathname)}
        >
          <Menu className="size-4" aria-hidden />
          Mi TruePhone
        </Button>
      </div>

      {open ? (
        <div className="md:hidden">
          <button
            type="button"
            className="bg-foreground/40 fixed inset-0 z-50"
            aria-label="Cerrar menú"
            onClick={() => setOpenedAtPath(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="bg-background border-border fixed inset-y-0 left-0 z-50 w-[min(20rem,90vw)] overflow-y-auto border-r p-4 pb-24 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <p id={titleId} className="text-foreground text-sm font-semibold">
                Menú
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Cerrar"
                onClick={() => setOpenedAtPath(null)}
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
