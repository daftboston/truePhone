"use client";

/**
 * @file theme-toggle.tsx
 * @description Client control to switch light/dark theme after hydration.
 * @dependencies lucide-react, theme-provider, @/components/ui/button
 */

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

/**
 * useIsClient
 *
 * Detects client hydration via useSyncExternalStore to avoid theme flicker.
 *
 * @returns True after client mount; false during SSR.
 * @calledBy ThemeToggle
 */
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * ThemeToggle
 *
 * Icon button that toggles resolved light/dark theme.
 *
 * @returns Ghost icon Button; disabled placeholder until hydrated.
 * @calledBy AppHeader
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <Button variant="ghost" size="icon" aria-label="Cambiar tema" disabled>
        <Sun />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Usar tema claro" : "Usar tema oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
