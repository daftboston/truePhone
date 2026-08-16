/**
 * @file mock.ts
 * @description Mock seller payout adapter for local/CI (no Pagos a Terceros).
 * @dependencies @/lib/payments/payouts/provider
 */

import type {
  CreateSellerPayoutInput,
  CreateSellerPayoutResult,
  PayoutProviderClient,
} from "@/lib/payments/payouts/provider";

/**
 * createMockPayoutProvider
 *
 * Local / CI payout adapter. Completes immediately (no Pagos a Terceros).
 *
 * @returns PayoutProviderClient with id MOCK.
 * @calledBy resolvePayoutProvider
 */
export function createMockPayoutProvider(): PayoutProviderClient {
  return {
    id: "MOCK",
    async createPayout(
      input: CreateSellerPayoutInput,
    ): Promise<CreateSellerPayoutResult> {
      if (input.amountPesos <= 0) {
        return {
          ok: false,
          error: "Monto de dispersión inválido.",
          failureCode: "INVALID_AMOUNT",
        };
      }
      return {
        ok: true,
        providerPayoutId: `mock_payout_${input.idempotencyKey}`,
        providerLoteId: `mock_lote_${input.idempotencyKey}`,
        status: "APPROVED",
      };
    },
  };
}
