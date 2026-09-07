/**
 * @file constants.ts
 * @description Operator identity and public legal routes. Update here when the
 *   company NIT / razón social is available — pages should not hardcode them.
 * @dependencies none
 */

/** Public brand / operator label until a registered legal entity is filled in. */
export const LEGAL_OPERATOR_NAME = "TruePhone";

/** Support and habeas-data contact. */
export const LEGAL_CONTACT_EMAIL = "hola@truephone.co";

/** mailto: href for LEGAL_CONTACT_EMAIL. */
export const LEGAL_CONTACT_MAILTO = `mailto:${LEGAL_CONTACT_EMAIL}`;

/** Governing country for these policies. */
export const LEGAL_JURISDICTION = "Colombia";

/** ISO date for last-updated stamps (YYYY-MM-DD). */
export const LEGAL_LAST_UPDATED_ISO = "2026-09-06";

/** Spanish last-updated label shown on legal pages. */
export const LEGAL_LAST_UPDATED_LABEL = "6 de septiembre de 2026";

/**
 * Public legal and help paths.
 *
 * @calledBy legal pages, footer, FAQ, signup, KYC privacy form
 */
export const LEGAL_PATHS = {
  help: "/ayuda",
  privacy: "/privacidad",
  terms: "/terminos",
  cookies: "/cookies",
} as const;
