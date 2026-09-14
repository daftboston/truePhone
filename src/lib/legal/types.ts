/**
 * @file types.ts
 * @description Shared types for public legal documents (privacy, terms, cookies).
 * @dependencies none
 */

/**
 * LegalSection
 *
 * One anchored heading on a legal page, with paragraphs and optional bullets.
 */
export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

/**
 * LegalSummary
 *
 * Optional 30-second bullets shown above the section chips (privacy only).
 */
export type LegalSummary = {
  title: string;
  bullets: string[];
};

/**
 * LegalDocument
 *
 * Full public legal page payload: route metadata plus ordered sections.
 *
 * @calledBy LegalDocument layout (Phase 23 pages)
 */
export type LegalDocument = {
  title: string;
  description: string;
  summary?: LegalSummary;
  sections: LegalSection[];
};
