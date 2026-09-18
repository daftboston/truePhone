/**
 * @file landing-preference.ts
 * @description Client localStorage helpers for last public landing route.
 * @dependencies browser localStorage
 */

/** LandingPreference — guest landing route persisted in localStorage. */
export type LandingPreference = "HOME" | "ANUNCIOS";

const STORAGE_KEY = "truephone:landing-preference";

/**
 * readLandingPreference
 *
 * Reads the guest landing preference from localStorage.
 *
 * @returns Stored preference or null when unset/invalid.
 */
export function readLandingPreference(): LandingPreference | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "HOME" || raw === "ANUNCIOS") return raw;
    return null;
  } catch {
    return null;
  }
}

/**
 * writeLandingPreference
 *
 * Persists the guest landing preference in localStorage.
 *
 * @param preference - HOME or ANUNCIOS.
 */
export function writeLandingPreference(preference: LandingPreference) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Ignore quota / private mode failures.
  }
}
