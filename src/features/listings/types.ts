/**
 * @file types.ts
 * @description Shared types and helpers for the listings feature.
 * @dependencies none
 */

export type ListingActionState =
  | {
      ok: true;
      message?: string;
      listingId?: string;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

export const LISTING_STEPS = [
  { id: "dispositivo", title: "Dispositivo", pathSuffix: "dispositivo" },
  { id: "fotos", title: "Fotos", pathSuffix: "fotos" },
  { id: "seguridad", title: "Seguridad", pathSuffix: "seguridad" },
  { id: "posesion", title: "Posesión", pathSuffix: "posesion" },
  { id: "revisar", title: "Revisar", pathSuffix: "revisar" },
] as const;

/**
 * Required gallery shots for a sell listing.
 * Eight guided slots cover the trust-critical angles (every body face buyers
 * inspect for damage, plus live screen, battery health, and IMEI).
 */
export const LISTING_PHOTO_SLOTS = [
  {
    id: "front",
    title: "Frente",
    tip: "iPhone de frente, buena luz, sin funda",
  },
  {
    id: "back",
    title: "Reverso",
    tip: "Cámara y carcasa completas",
  },
  {
    id: "left",
    title: "Lado izquierdo",
    tip: "Perfil izquierdo con botón de volumen",
  },
  {
    id: "right",
    title: "Lado derecho",
    tip: "Perfil derecho con botón lateral",
  },
  {
    id: "bottom",
    title: "Parte inferior",
    tip: "Puerto de carga y borde inferior",
  },
  {
    id: "screen",
    title: "Pantalla",
    tip: "Pantalla encendida, sin grietas ocultas",
  },
  {
    id: "battery",
    title: "Batería",
    tip: "Ajustes → Batería → Salud de la batería",
  },
  {
    id: "imei",
    title: "IMEI",
    tip: "Ajustes → General → Información → IMEI",
  },
] as const;

export type ListingPhotoSlotId = (typeof LISTING_PHOTO_SLOTS)[number]["id"];

/** Sellers must fill every guided slot before continuing. */
export const MIN_LISTING_GALLERY_PHOTOS = LISTING_PHOTO_SLOTS.length;

/**
 * Hard cap: the guided slots plus optional extra angles (PRD recommends 12+).
 * Deliberately larger than the slot count so extras are allowed, not an error.
 */
export const MAX_LISTING_GALLERY_PHOTOS = 12;

/** @deprecated Prefer LISTING_PHOTO_SLOTS; kept for any lingering copy references. */
export const LISTING_PHOTO_SHOT_LIST = LISTING_PHOTO_SLOTS.map(
  (slot) => slot.title,
);

/**
 * fieldErrorsFromZod
 *
 * Flattens Zod issues into a field-name → messages map for form UI.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
export function fieldErrorsFromZod(
  error: import("zod").ZodError,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    fieldErrors[key] ??= [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

/**
 * listingStepPath
 *
 * Supports listings by implementing listingStepPath.
 *
 * @param args - Function arguments.
 * @returns Function result.
 * @calledBy listings UI and related modules
 */
export function listingStepPath(listingId: string, step: number) {
  const suffix = LISTING_STEPS[step - 1]?.pathSuffix ?? "dispositivo";
  return `/vender/${listingId}/${suffix}`;
}
