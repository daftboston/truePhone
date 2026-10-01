/**
 * @file extract-guide-faqs.ts
 * @description Parses visible FAQ pairs from a guide markdown body for JSON-LD.
 * @dependencies none
 */

export type GuideFaq = {
  question: string;
  answer: string;
};

/**
 * extractGuideFaqs
 *
 * Reads `**¿Question?** Answer` lines from the Preguntas frecuentes section.
 *
 * @param content - Guide markdown body.
 * @returns FAQ pairs that match visible copy (for FAQPage JSON-LD).
 * @calledBy /guias/[slug] page
 */
export function extractGuideFaqs(content: string): GuideFaq[] {
  const section = content.split(/^## Preguntas frecuentes\s*$/m)[1];

  if (!section) {
    return [];
  }

  return [...section.matchAll(/\*\*(.+?\?)\*\*\s+([^\n]+)/g)].map((match) => ({
    question: match[1].trim(),
    answer: match[2].trim(),
  }));
}
