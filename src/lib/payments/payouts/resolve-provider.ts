/**
 * @file resolve-provider.ts
 * @description Selects Wompi vs mock payout (dispersion) provider from env.
 * @dependencies @/lib/payments/payouts/mock, provider, wompi
 */

import { createMockPayoutProvider } from "@/lib/payments/payouts/mock";
import type {
  PayoutProviderClient,
  PayoutProviderId,
} from "@/lib/payments/payouts/provider";
import {
  createWompiPayoutProvider,
  getWompiPayoutsEnv,
} from "@/lib/payments/payouts/wompi";

/**
 * resolvePayoutProvider
 *
 * Resolve payout (dispersion) provider.
 * - `PAYOUTS_PROVIDER=mock` forces mock
 * - `PAYOUTS_PROVIDER=wompi` requires Pagos a Terceros env
 * - unset: mock until payout keys exist (safe default while Checkout may be live)
 *
 * @returns provider client and mode id.
 * @calledBy financial-core settlement authorizeAndSubmitPayout
 */
export function resolvePayoutProvider(): {
  provider: PayoutProviderClient;
  mode: PayoutProviderId;
} {
  const forced = process.env.PAYOUTS_PROVIDER?.trim().toLowerCase();

  if (forced === "mock") {
    return { provider: createMockPayoutProvider(), mode: "MOCK" };
  }

  const wompiEnv = getWompiPayoutsEnv();
  if (forced === "wompi") {
    if (!wompiEnv) {
      throw new Error(
        "PAYOUTS_PROVIDER=wompi requiere WOMPI_PAYOUTS_API_KEY y WOMPI_PAYOUTS_USER_PRINCIPAL_ID.",
      );
    }
    return { provider: createWompiPayoutProvider(wompiEnv), mode: "WOMPI" };
  }

  if (wompiEnv) {
    return { provider: createWompiPayoutProvider(wompiEnv), mode: "WOMPI" };
  }

  return { provider: createMockPayoutProvider(), mode: "MOCK" };
}
