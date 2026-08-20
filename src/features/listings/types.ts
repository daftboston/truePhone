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

/** PRD minimum gallery photos (front/back/sides/screen/battery/IMEI). */
export const MIN_LISTING_GALLERY_PHOTOS = 8;

export const LISTING_PHOTO_SHOT_LIST = [
  "Frente",
  "Reverso",
  "Lado izquierdo",
  "Lado derecho",
  "Parte superior",
  "Parte inferior",
  "Pantalla encendida",
  "Salud de batería (Ajustes)",
  "IMEI (Ajustes → General → Información)",
  "Accesorios",
] as const;

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
