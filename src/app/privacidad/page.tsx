/**
 * @file page.tsx
 * @description Public privacy policy at /privacidad (Phase 23).
 * @dependencies LegalDocument, PRIVACY_DOCUMENT
 */

import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";
import { LEGAL_PATHS, PRIVACY_DOCUMENT } from "@/lib/legal";

export const metadata: Metadata = {
  title: PRIVACY_DOCUMENT.title,
  description: PRIVACY_DOCUMENT.description,
};

/**
 * PrivacidadPage
 *
 * Renders the Spanish privacy policy.
 *
 * @returns Public legal page.
 */
export default function PrivacidadPage() {
  return (
    <LegalDocument
      document={PRIVACY_DOCUMENT}
      currentPath={LEGAL_PATHS.privacy}
    />
  );
}
