/**
 * @file page.tsx
 * @description Public terms of use at /terminos (Phase 23).
 * @dependencies LegalDocument, TERMS_DOCUMENT
 */

import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";
import { LEGAL_PATHS, TERMS_DOCUMENT } from "@/lib/legal";

export const metadata: Metadata = {
  title: TERMS_DOCUMENT.title,
  description: TERMS_DOCUMENT.description,
};

/**
 * TerminosPage
 *
 * Renders the Spanish marketplace terms.
 *
 * @returns Public legal page.
 */
export default function TerminosPage() {
  return (
    <LegalDocument document={TERMS_DOCUMENT} currentPath={LEGAL_PATHS.terms} />
  );
}
