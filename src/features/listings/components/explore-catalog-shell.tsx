"use client";

/**
 * @file explore-catalog-shell.tsx
 * @description Client shell that flips every Explorar model card to the rear at once.
 * @dependencies react, @/components/ui/button, @/lib/utils
 */

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExploreCatalogShellProps = {
  children: ReactNode;
};

/**
 * PhoneRearIcon
 *
 * Draws a phone back with a diagonal dual-camera bump.
 *
 * @returns Decorative SVG for the “show backs” idle state.
 * @calledBy ExploreCatalogShell
 */
function PhoneRearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-[26px]">
      <rect
        x="6"
        y="2.5"
        width="12"
        height="19"
        rx="2.75"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <rect
        x="7.75"
        y="4.5"
        width="6.25"
        height="6.25"
        rx="1.6"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="9.85" cy="6.55" r="1.05" fill="currentColor" />
      <circle cx="12.05" cy="8.8" r="1.05" fill="currentColor" />
    </svg>
  );
}

/**
 * PhoneFrontIcon
 *
 * Draws a phone front with a TrueDepth notch.
 *
 * @returns Decorative SVG for the “show fronts” pressed state.
 * @calledBy ExploreCatalogShell
 */
function PhoneFrontIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-[26px]">
      <rect
        x="6"
        y="2.5"
        width="12"
        height="19"
        rx="2.75"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <rect
        x="9.25"
        y="4.15"
        width="5.5"
        height="1.7"
        rx="0.85"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * ExploreCatalogShell
 *
 * Wraps the series grid and a fixed control that shows every rear product shot.
 *
 * @param props.children - Server-rendered series sections.
 * @returns Catalog markup plus a bottom-right flip control.
 * @calledBy ExplorePage
 */
export function ExploreCatalogShell({ children }: ExploreCatalogShellProps) {
  const [showBacks, setShowBacks] = useState(false);
  const label = showBacks
    ? "Ver el frente de los iPhones"
    : "Ver la parte trasera de los iPhones";

  return (
    <div className={cn(showBacks && "explore-show-backs")}>
      {children}
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-pressed={showBacks}
        aria-label={label}
        title={label}
        onClick={() => setShowBacks((open) => !open)}
        className={cn(
          "bg-card tp-glass border-border fixed z-50 rounded-full shadow-[var(--shadow-card)]",
          "right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:right-6 md:bottom-6",
          "size-11 [&_svg]:size-[26px]",
          showBacks && "border-trust/50 text-foreground",
        )}
      >
        {showBacks ? <PhoneFrontIcon /> : <PhoneRearIcon />}
      </Button>
    </div>
  );
}
