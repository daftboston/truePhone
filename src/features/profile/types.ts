/**
 * @file types.ts
 * @description Shared profile action state, Zod field helpers, and display utilities.
 * @dependencies none
 */

/**
 * Result shape returned by profile server actions bound to useActionState.
 * `null` is the idle initial state before the first submission.
 */
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

/**
 * fieldErrorsFromZod
 *
 * Flattens Zod issues into a field-name → messages map for form UI.
 *
 * @param error - Zod validation error from safeParse.
 * @returns Record of field keys to error message arrays.
 * @calledBy updateProfileAction, changePasswordAction, uploadAvatarAction consumers
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
 * formatMemberSince
 *
 * Formats a join date as month + year in es-CO locale.
 *
 * @param date - Profile createdAt timestamp.
 * @returns Localized "mes año" string.
 * @calledBy ProfileHeader, PartyCard
 */
export function formatMemberSince(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * formatSellerRating
 *
 * Builds a short rating label for seller profile headers.
 *
 * @param rating - Average seller rating (0 when none).
 * @returns Spanish copy for empty or rated sellers.
 * @calledBy ProfileHeader, PartyCard
 */
export function formatSellerRating(rating: number) {
  if (!rating) return "Sin calificaciones";
  return `${rating.toFixed(1)} · ${rating >= 4.5 ? "Excelente" : "Bueno"}`;
}

/**
 * publicProfilePath
 *
 * Builds the public `/u/{username}` path when a username exists.
 *
 * @param username - Profile username or null/undefined.
 * @returns Public path string, or null when username is missing.
 * @calledBy profile pages, ShareProfileButton callers
 */
export function publicProfilePath(username: string | null | undefined) {
  if (!username) return null;
  return `/u/${username}`;
}

/**
 * isIdentityVerified
 *
 * Checks whether Verifik identity status is verified.
 *
 * @param verifikStatus - Profile verifikStatus string.
 * @returns True when status equals `"verified"`.
 * @calledBy ProfileHeader, PartyCard
 */
export function isIdentityVerified(verifikStatus: string) {
  return verifikStatus === "verified";
}
