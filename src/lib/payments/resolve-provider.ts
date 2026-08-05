/**
 * @file resolve-provider.ts
 * @description Selects Wompi vs mock payment provider from env.
 * @dependencies @/lib/payments/mock, provider, wompi
 */

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
 * - unset: Wompi when configured, otherwise mock (local-friendly)
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

  if (forced === "mock") {
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
  const forced = process.env.PAYMENTS_PROVIDER?.trim().toLowerCase();
  if (forced === "mock") return true;
  if (forced === "wompi") return false;
  return getWompiEnv() === null;
}
