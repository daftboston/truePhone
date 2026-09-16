/**
 * @file format-guide-date.ts
 * @description Spanish long-form dates for guide bylines (es-CO).
 * @dependencies none
 */

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/**
 * formatGuideDate
 *
 * Formats an ISO date (YYYY-MM-DD) for public guide bylines.
 *
 * @param isoDate - Date string from guide front matter.
 * @returns Spanish label such as "16 de septiembre de 2026".
 * @calledBy Guia detail page
 */
export function formatGuideDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const monthLabel = MONTHS_ES[month - 1];

  if (!year || !day || !monthLabel) {
    return isoDate;
  }

  return `${day} de ${monthLabel} de ${year}`;
}
