/**
 * @file operator-identity.ts
 * @description Composes public operator identity copy from legal constants.
 * @dependencies ./constants
 */

import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_JUDICIAL_ADDRESS,
  LEGAL_JURISDICTION,
  LEGAL_NIT,
  LEGAL_OPERATOR_NAME,
  LEGAL_PHONE,
  LEGAL_RAZON_SOCIAL,
} from "./constants";

/**
 * hasOperatorIdentity
 *
 * True when the registered operator name is filled in constants.
 *
 * @returns Whether public identity fields are configured.
 * @calledBy SiteFooter
 */
export function hasOperatorIdentity(): boolean {
  return LEGAL_RAZON_SOCIAL.length > 0;
}

/**
 * formatOperatorIdentityLegalParagraph
 *
 * Lawyer-approved identity block for terms and privacy pages.
 *
 * @returns Single paragraph with operator name, NIT, address, phone, and email.
 * @calledBy TERMS_DOCUMENT, PRIVACY_DOCUMENT
 */
export function formatOperatorIdentityLegalParagraph(): string {
  return `${LEGAL_OPERATOR_NAME} es operado en ${LEGAL_JURISDICTION} por ${LEGAL_RAZON_SOCIAL}, persona natural, NIT ${LEGAL_NIT}. Dirección de notificación judicial: ${LEGAL_JUDICIAL_ADDRESS}. Teléfono: ${LEGAL_PHONE}. Correo: ${LEGAL_CONTACT_EMAIL}.`;
}

/**
 * formatOperatorIdentityFooterLine
 *
 * Compact footer identity line joined with middle dots.
 *
 * @returns Footer identity string or empty when not configured.
 * @calledBy SiteFooter
 */
export function formatOperatorIdentityFooterLine(): string {
  if (!hasOperatorIdentity()) {
    return "";
  }

  return [
    LEGAL_RAZON_SOCIAL,
    `NIT ${LEGAL_NIT}`,
    LEGAL_JUDICIAL_ADDRESS,
    LEGAL_PHONE,
    LEGAL_CONTACT_EMAIL,
  ].join(" · ");
}
