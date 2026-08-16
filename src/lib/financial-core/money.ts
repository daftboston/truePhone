/**
 * @file money.ts
 * @description Integer COP peso helpers; sole rounding boundary for money math.
 * @dependencies none
 */

/**
 * halfUpPesos
 *
 * Half-up rounding to integer COP pesos.
 * Never use floating point for money beyond this boundary.
 *
 * @param value - Numeric amount possibly with fractions.
 * @returns Rounded integer pesos.
 * @throws When value is not finite.
 * @calledBy fees.computeFees, settlement and cancel money paths
 */
export function halfUpPesos(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Invalid money value.");
  }
  return Math.round(value);
}

/**
 * assertNonNegativePesos
 *
 * Validates that a value is a non-negative integer COP amount.
 *
 * @param value - Candidate peso amount.
 * @param label - Error label for the field; defaults to "amount".
 * @throws When value is not a non-negative integer.
 * @calledBy Ledger and fee writers that require safe amounts
 */
export function assertNonNegativePesos(value: number, label = "amount") {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer COP amount.`);
  }
}
