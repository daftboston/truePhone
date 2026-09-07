/**
 * @file page.tsx
 * @description Public cookie policy at /cookies (Phase 23).
 * @dependencies LegalDocument, COOKIES_DOCUMENT
 */

import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";
import { COOKIES_DOCUMENT, LEGAL_PATHS } from "@/lib/legal";

export const metadata: Metadata = {
  title: COOKIES_DOCUMENT.title,
  description: COOKIES_DOCUMENT.description,
};

/**
 * CookiesPage
 *
 * Renders the Spanish cookie policy.
 *
 * @returns Public legal page.
 */
export default function CookiesPage() {
  return (
    <LegalDocument
      document={COOKIES_DOCUMENT}
      currentPath={LEGAL_PATHS.cookies}
    />
  );
}
