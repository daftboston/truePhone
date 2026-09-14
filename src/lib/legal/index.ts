/**
 * @file index.ts
 * @description Public exports for legal copy and operator constants.
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
} from "./constants";
export { COOKIES_DOCUMENT } from "./cookies";
export { PRIVACY_DOCUMENT } from "./privacy";
export { TERMS_DOCUMENT } from "./terms";
export type { LegalDocument, LegalSection, LegalSummary } from "./types";
