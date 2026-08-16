/**
 * @file mock.ts
 * @description Mock payment provider for local/CI when Wompi keys are absent.
 * @dependencies @/lib/payments/provider
 */

import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProviderClient,
  RefundInput,
  RefundResult,
} from "@/lib/payments/provider";

/**
 * createMockProvider
 *
 * Local / CI provider when Wompi keys are absent.
 * Checkout URL points at an in-app confirm page.
 *
 * @param siteOrigin - Absolute site origin for mock checkout URLs.
 * @returns PaymentProviderClient with id MOCK.
 * @calledBy resolvePaymentProvider
 */
export function createMockProvider(siteOrigin: string): PaymentProviderClient {
  return {
    id: "MOCK",

    async createCheckout(
      input: CreateCheckoutInput,
    ): Promise<CreateCheckoutResult> {
      const providerCheckoutId = `mock_${input.reference}`;
      const url = new URL("/api/payments/mock/checkout", siteOrigin);
      url.searchParams.set("reference", input.reference);
      url.searchParams.set("redirect", input.redirectUrl);
      return {
        providerCheckoutId,
        checkoutUrl: url.toString(),
      };
    },

    async refund(input: RefundInput): Promise<RefundResult> {
      return { ok: true, refundedAmountPesos: input.amountPesos };
    },
  };
}
