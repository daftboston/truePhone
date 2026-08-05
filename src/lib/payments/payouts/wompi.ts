/**
 * @file wompi.ts
 * @description Wompi Pagos a Terceros env + stub payout provider adapter.
 * @dependencies @/lib/payments/payouts/provider
 */

import type {
  CreateSellerPayoutInput,
  CreateSellerPayoutResult,
  PayoutProviderClient,
} from "@/lib/payments/payouts/provider";

export type WompiPayoutsEnv = {
  apiKey: string;
  userPrincipalId: string;
  accountId?: string | null;
  apiBaseUrl: string;
};

/**
 * getWompiPayoutsEnv
 *
 * Pagos a Terceros credentials (separate from Checkout keys).
 * Activate the product in Wompi before using production dispersion.
 *
 * @returns Env object or null when required keys are missing.
 * @calledBy resolvePayoutProvider, createWompiPayoutProvider
 */
export function getWompiPayoutsEnv(): WompiPayoutsEnv | null {
  const apiKey = process.env.WOMPI_PAYOUTS_API_KEY?.trim();
  const userPrincipalId = process.env.WOMPI_PAYOUTS_USER_PRINCIPAL_ID?.trim();
  if (!apiKey || !userPrincipalId) return null;

  return {
    apiKey,
    userPrincipalId,
    accountId: process.env.WOMPI_PAYOUTS_ACCOUNT_ID?.trim() || null,
    apiBaseUrl:
      process.env.WOMPI_PAYOUTS_API_BASE_URL?.trim() ||
      "https://api.payouts.wompi.co/v1",
  };
}

/**
 * createWompiPayoutProvider
 *
 * Stub adapter for Wompi Pagos a Terceros.
 * Real lote creation lands when the product is activated; until then this
 * refuses live calls so Checkout keys are never confused with payout keys.
 *
 * @param env - Validated Pagos a Terceros env.
 * @returns PayoutProviderClient that currently returns PAYOUTS_NOT_CONFIGURED.
 * @calledBy resolvePayoutProvider
 */
export function createWompiPayoutProvider(
  env: WompiPayoutsEnv,
): PayoutProviderClient {
  return {
    id: "WOMPI",
    async createPayout(
      input: CreateSellerPayoutInput,
    ): Promise<CreateSellerPayoutResult> {
      void input;
      void env;
      return {
        ok: false,
        error:
          "Pagos a Terceros aún no está activado en este entorno. Usa el adaptador mock o completa la integración de lotes.",
        failureCode: "PAYOUTS_NOT_CONFIGURED",
      };
    },
  };
}
