/**
 * @file provider.ts
 * @description Types for seller payout (dispersion) providers.
 * @dependencies none
 */

export type PayoutProviderId = "WOMPI" | "MOCK" | "MANUAL";

export type CreateSellerPayoutInput = {
  idempotencyKey: string;
  amountPesos: number;
  currency: string;
  reference: string;
  destination: {
    legalIdType: string;
    legalId: string;
    bankCode: string;
    accountType: "AHORROS" | "CORRIENTE";
    accountNumber: string;
    holderName: string;
    email: string;
  };
};

export type CreateSellerPayoutResult =
  | {
      ok: true;
      providerPayoutId: string;
      providerLoteId?: string | null;
      status: "PENDING" | "PROCESSING" | "APPROVED" | "FAILED";
    }
  | { ok: false; error: string; failureCode?: string };

export type PayoutProviderClient = {
  id: PayoutProviderId;
  createPayout: (
    input: CreateSellerPayoutInput,
  ) => Promise<CreateSellerPayoutResult>;
};
