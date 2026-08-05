/**
 * @file format-money.ts
 * @description Client-safe COP money formatting without DB imports.
 * @dependencies Intl.NumberFormat
 */

/**
 * formatOrderMoney
 *
 * Formats a peso amount for display in es-CO currency style.
 *
 * @param value - Amount in integer COP pesos.
 * @param currency - ISO currency code; defaults to COP.
 * @returns Localized currency string (no fraction digits).
 * @calledBy Order detail, listing price displays, payment UI
 */
export function formatOrderMoney(value: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
