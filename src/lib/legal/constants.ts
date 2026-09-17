/**
 * @file constants.ts
 * @description Operator identity and public legal routes. Update here when the
 *   company NIT / razón social is available — pages should not hardcode them.
 * @dependencies none
 */

/** Public brand / operator label until a registered legal entity is filled in. */
export const LEGAL_OPERATOR_NAME = "TruePhone";

/** Support and habeas-data contact. */
export const LEGAL_CONTACT_EMAIL = "truephonecol@gmail.com";

/** mailto: href for LEGAL_CONTACT_EMAIL. */
export const LEGAL_CONTACT_MAILTO = `mailto:${LEGAL_CONTACT_EMAIL}`;

/** Governing country for these policies. */
export const LEGAL_JURISDICTION = "Colombia";

/** ISO date for last-updated stamps (YYYY-MM-DD). */
export const LEGAL_LAST_UPDATED_ISO = "2026-09-17";

/** Spanish last-updated label shown on legal pages. */
export const LEGAL_LAST_UPDATED_LABEL = "17 de septiembre de 2026";

/** Registered operator name (persona natural). */
export const LEGAL_RAZON_SOCIAL = "Daniel Santoyo Panche";

/** Operator NIT (no verification digit). */
export const LEGAL_NIT = "1019013998";

/** Judicial / domicile address for legal notices. */
export const LEGAL_JUDICIAL_ADDRESS = "Calle 134 # 41A-51, Bogotá, Colombia";

/** Public contact phone (temporary personal line; swap in constants when needed). */
export const LEGAL_PHONE = "3214527399";

/**
 * Public legal and help paths.
 *
 * @calledBy legal pages, footer, FAQ, signup, KYC privacy form
 */
export const LEGAL_PATHS = {
  help: "/ayuda",
  guides: "/guias",
  privacy: "/privacidad",
  terms: "/terminos",
  cookies: "/cookies",
  pqr: "/pqr",
} as const;

/** Checkout/listing microcopy — statutory retracto notice (Ley 1480). */
export const RETRACTO_CHECKOUT_NOTICE =
  "Puedes tener derecho de retracto de 5 días hábiles desde la entrega (Ley 1480). Detalles en Términos y en /pqr.";
