/**
 * @file resolve-provider.ts
 * @description Selects mock / manual / Wompi payout (dispersion) provider from env.
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
 * createManualPayoutProvider
 *
 * No-op provider for MVP ops supervision: Financial Core authorizes only;
 * humans pay in the Wompi dashboard, then mark completed in TruePhone.
 *
 * @returns PayoutProviderClient that refuses auto-submit (caller skips createPayout).
 * @calledBy resolvePayoutProvider
 */
function createManualPayoutProvider(): PayoutProviderClient {
  return {
    id: "MANUAL",
    async createPayout() {
      return {
        ok: false,
        error:
          "Dispersión manual: paga en el panel de Wompi y marca el pago como completado en TruePhone.",
        failureCode: "MANUAL_PAYOUT_REQUIRED",
      };
    },
  };
}

/**
 * resolvePayoutProvider
 *
 * Resolve payout (dispersion) provider.
 * - `PAYOUTS_PROVIDER=mock` — local/CI auto-complete
 * - `PAYOUTS_PROVIDER=manual` — authorize only; ops pays in Wompi (MVP production)
 * - `PAYOUTS_PROVIDER=wompi` — Pagos a Terceros API (Phase 24; stub until activated)
 * - unset: **manual** (safe default for supervised dispersion)
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

  if (forced === "wompi") {
    const wompiEnv = getWompiPayoutsEnv();
    if (!wompiEnv) {
      throw new Error(
        "PAYOUTS_PROVIDER=wompi requiere WOMPI_PAYOUTS_API_KEY y WOMPI_PAYOUTS_USER_PRINCIPAL_ID.",
      );
    }
    return { provider: createWompiPayoutProvider(wompiEnv), mode: "WOMPI" };
  }

  // manual (explicit or default) — MVP supervised path
  return { provider: createManualPayoutProvider(), mode: "MANUAL" };
}
