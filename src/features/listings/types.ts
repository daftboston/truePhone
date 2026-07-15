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

export function listingStepPath(listingId: string, step: number) {
  const suffix = LISTING_STEPS[step - 1]?.pathSuffix ?? "dispositivo";
  return `/vender/${listingId}/${suffix}`;
}
