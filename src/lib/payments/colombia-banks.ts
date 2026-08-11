/**
 * @file colombia-banks.ts
 * @description Common Colombian bank ACH codes for seller payout destinations.
 * @dependencies none
 *
 * Codes follow ACH/PSE conventions used across Colombian payment rails.
 * Wompi dashboard uses bank names; Phase 24 API may map these to Wompi bank UUIDs.
 */

export type ColombiaBank = {
  code: string;
  name: string;
};

/** Frequent retail / wallet destinations for MVP seller payouts. */
export const COLOMBIA_BANKS: readonly ColombiaBank[] = [
  { code: "1007", name: "Bancolombia" },
  { code: "1051", name: "Davivienda" },
  { code: "1507", name: "Nequi" },
  { code: "1551", name: "Daviplata" },
  { code: "1001", name: "Banco de Bogotá" },
  { code: "1013", name: "BBVA Colombia" },
  { code: "1019", name: "Scotiabank Colpatria" },
  { code: "1023", name: "Banco de Occidente" },
  { code: "1052", name: "Banco AV Villas" },
  { code: "1002", name: "Banco Popular" },
  { code: "1062", name: "Banco Falabella" },
  { code: "1032", name: "Banco Caja Social" },
  { code: "1040", name: "Banco Agrario" },
  { code: "1012", name: "GNB Sudameris" },
  { code: "1006", name: "Itaú" },
  { code: "1801", name: "Movii" },
] as const;

/**
 * findColombiaBank
 *
 * Looks up a bank by ACH code.
 *
 * @param code - Four-digit ACH bank code.
 * @returns Matching bank or undefined.
 * @calledBy upsertSellerBankAccountAction
 */
export function findColombiaBank(code: string) {
  return COLOMBIA_BANKS.find((b) => b.code === code);
}
