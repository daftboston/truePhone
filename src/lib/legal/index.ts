/**
 * @file index.ts
 * @description Client-safe legal exports (constants, documents). Server-only
 *   acceptance helpers live in ./acceptance.ts — import that path directly from
 *   Server Actions / Route Handlers, not from this barrel.
 * @dependencies ./constants, ./cookies, ./privacy, ./terms, ./types
 */

export {
  LEGAL_CONTACT_EMAIL,
  LEGAL_CONTACT_MAILTO,
  LEGAL_JUDICIAL_ADDRESS,
  LEGAL_JURISDICTION,
  LEGAL_LAST_UPDATED_ISO,
  LEGAL_LAST_UPDATED_LABEL,
  LEGAL_NIT,
  LEGAL_OPERATOR_NAME,
  LEGAL_PATHS,
  LEGAL_PHONE,
  LEGAL_RAZON_SOCIAL,
  RETRACTO_CHECKOUT_NOTICE,
} from "./constants";
export {
  formatOperatorIdentityFooterLine,
  formatOperatorIdentityLegalParagraph,
  hasOperatorIdentity,
} from "./operator-identity";
export { COOKIES_DOCUMENT } from "./cookies";
export { PRIVACY_DOCUMENT } from "./privacy";
export { TERMS_DOCUMENT } from "./terms";
export type { LegalDocument, LegalSection, LegalSummary } from "./types";
