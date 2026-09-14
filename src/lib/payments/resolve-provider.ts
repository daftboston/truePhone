/**
 * @file resolve-provider.ts
 * @description Selects Wompi vs mock payment provider from env.
 * @dependencies @/lib/env, @/lib/payments/mock, provider, wompi
 */

import { isVercelProduction } from "@/lib/env";
import { createMockProvider } from "@/lib/payments/mock";
import {
  type PaymentProviderClient,
  type PaymentProviderId,
} from "@/lib/payments/provider";
import { createWompiProvider, getWompiEnv } from "@/lib/payments/wompi";

/**
 * resolvePaymentProvider
 *
 * Resolve the active payment provider.
 * - `PAYMENTS_PROVIDER=mock` forces mock
 * - `PAYMENTS_PROVIDER=wompi` requires Wompi env
 * - unset: Wompi when configured, otherwise mock (local / Preview)
 * Production (`VERCEL_ENV=production`) never falls back to mock.
 *
 * @param siteOrigin - Absolute origin passed to the mock provider.
 * @returns provider client and mode id.
 * @calledBy payments.ts checkout and refund orchestration
 */
export function resolvePaymentProvider(siteOrigin: string): {
  provider: PaymentProviderClient;
  mode: PaymentProviderId;
} {
  const forced = process.env.PAYMENTS_PROVIDER?.trim().toLowerCase();
  const production = isVercelProduction();

  if (forced === "mock") {
    if (production) {
      throw new Error(
        "PAYMENTS_PROVIDER=mock is not allowed in production. Set Wompi keys and PAYMENTS_PROVIDER=wompi.",
      );
    }
    return { provider: createMockProvider(siteOrigin), mode: "MOCK" };
  }

  const wompiEnv = getWompiEnv();
  if (forced === "wompi") {
    if (!wompiEnv) {
      throw new Error(
        "PAYMENTS_PROVIDER=wompi requiere WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY y WOMPI_EVENTS_SECRET.",
      );
    }
    return { provider: createWompiProvider(wompiEnv), mode: "WOMPI" };
  }

  if (wompiEnv) {
    return { provider: createWompiProvider(wompiEnv), mode: "WOMPI" };
  }

  if (production) {
    throw new Error(
      "Production requires WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY, and WOMPI_EVENTS_SECRET. Mock payments are disabled.",
    );
  }

  return { provider: createMockProvider(siteOrigin), mode: "MOCK" };
}

/**
 * isMockPaymentsEnabled
 *
 * Whether the resolved payment stack would use the mock provider.
 *
 * @returns True when forced mock or Wompi env is missing.
 * @calledBy Dev UI / payment diagnostics
 */
export function isMockPaymentsEnabled() {
  if (isVercelProduction()) return false;
  const forced = process.env.PAYMENTS_PROVIDER?.trim().toLowerCase();
  if (forced === "mock") return true;
  if (forced === "wompi") return false;
  return getWompiEnv() === null;
}
