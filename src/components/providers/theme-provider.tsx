"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";
const THEME_CHANGE_EVENT = "truephone-theme-change";

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: "class";
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeContextValue = {
  theme: Theme | undefined;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme | undefined;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
);

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(
  theme: Theme,
  enableSystem: boolean,
  systemTheme: ResolvedTheme,
): ResolvedTheme {
  if (theme === "system") {
    return enableSystem ? systemTheme : "light";
  }

  return theme;
}

function applyTheme(
  resolved: ResolvedTheme,
  disableTransitionOnChange: boolean,
) {
  const root = document.documentElement;

  if (disableTransitionOnChange) {
    root.classList.add("disable-transitions");
  }

  root.classList.toggle("dark", resolved === "dark");

  if (disableTransitionOnChange) {
    requestAnimationFrame(() => {
      root.classList.remove("disable-transitions");
    });
  }
}

function readStoredTheme(defaultTheme: Theme): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage may be unavailable in private mode.
  }

  return defaultTheme;
}

function subscribeSystemTheme(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function subscribeStoredTheme(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const theme = React.useSyncExternalStore(
    subscribeStoredTheme,
    () => readStoredTheme(defaultTheme),
    () => defaultTheme,
  );

  const systemTheme = React.useSyncExternalStore(
    subscribeSystemTheme,
    getSystemTheme,
    () => "light" as const,
  );

  const resolvedTheme = resolveTheme(theme, enableSystem, systemTheme);

  React.useEffect(() => {
    applyTheme(resolvedTheme, disableTransitionOnChange);
  }, [disableTransitionOnChange, resolvedTheme]);

  const setTheme = React.useCallback((nextTheme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage failures.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
    }),
    [resolvedTheme, setTheme, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
