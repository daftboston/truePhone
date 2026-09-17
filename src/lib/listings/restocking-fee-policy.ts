/**
 * @file restocking-fee-policy.ts
 * @description Detects prohibited seller restocking / penalidad language in listings.
 * @dependencies none
 */

/** Spanish-first patterns; includes English only for moderation detection. */
const RESTOCKING_FEE_PATTERNS: RegExp[] = [
  /cuota\s+de\s+reposici[oó]n/i,
  /\breposici[oó]n\b/i,
  /penalidad\s+por\s+arrepentimiento/i,
  /cargo\s+por\s+devoluci[oó]n\s+voluntaria/i,
  /descuento\s+sobre\s+el\s+reembolso/i,
  /restocking/i,
  /buyer['']s\s+remorse/i,
  /purchase\s+is\s+final/i,
];

/** Suggested rejection copy for reviewers (Spanish). */
export const RESTOCKING_FEE_REJECTION_SUGGESTION =
  "El anuncio menciona cuota de reposición, penalidad por arrepentimiento o descuentos sobre el reembolso. TruePhone no permite esos cobros. Pide al vendedor que edite la descripción.";

/**
 * detectRestockingFeeLanguage
 *
 * Returns true when listing text likely violates the no-restocking-fee policy.
 *
 * @param text - Title, description, or combined listing copy.
 * @returns Whether moderation should flag the listing.
 * @calledBy listing review UI
 */
export function detectRestockingFeeLanguage(text: string | null | undefined) {
  if (!text?.trim()) return false;
  const normalized = text.normalize("NFC");
  return RESTOCKING_FEE_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * scanListingForRestockingFeeLanguage
 *
 * Checks title and description together.
 *
 * @param listing - Listing text fields.
 * @returns Whether any field matches prohibited language.
 * @calledBy listing review detail page
 */
export function scanListingForRestockingFeeLanguage(listing: {
  title: string;
  description: string | null;
}) {
  return (
    detectRestockingFeeLanguage(listing.title) ||
    detectRestockingFeeLanguage(listing.description)
  );
}
