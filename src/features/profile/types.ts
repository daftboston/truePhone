export type ProfileActionState =
  | {
      ok: true;
      message?: string;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

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

export function formatMemberSince(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatSellerRating(rating: number) {
  if (!rating) return "Sin calificaciones";
  return `${rating.toFixed(1)} · ${rating >= 4.5 ? "Excelente" : "Bueno"}`;
}

export function publicProfilePath(username: string | null | undefined) {
  if (!username) return null;
  return `/u/${username}`;
}

export function isIdentityVerified(verifikStatus: string) {
  return verifikStatus === "verified";
}
