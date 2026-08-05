/**
 * @file fees.ts
 * @description Canonical marketplace fee engine and Wompi cost snapshots (FINANCIAL_MODEL.md).
 * @dependencies @/lib/financial-core/money
 */

import {
  assertNonNegativePesos,
  halfUpPesos,
} from "@/lib/financial-core/money";

/** Default buyer marketplace fee (growth phase). */
export const MARKETPLACE_FEE_RATE = 0.1;
export const MARKETPLACE_FEE_RATE_BPS = 1000;

/** One-time loyalty fee after seller cancel / no-ship. */
export const LOYALTY_FEE_RATE = 0.08;
export const LOYALTY_FEE_RATE_BPS = 800;

/** Wompi collection fee on buyer total (before IVA). */
export const WOMPI_COLLECTION_RATE = 0.0275;
/** Wompi payout fee on seller amount dispersed (before IVA). */
export const WOMPI_PAYOUT_RATE = 0.0045;
/** IVA on Wompi service fees (not on TruePhone marketplace %). */
export const WOMPI_IVA_RATE = 0.19;

/** Premium Bogotá logistics fee deducted from seller at payout (COP). */
export const PREMIUM_SHIPPING_FEE_PESOS = 20_000;

export type FeeRateKind = "default" | "loyalty";

export type OrderFeeSnapshot = {
  salePrice: number;
  feeRate: number;
  feeRateBps: number;
  buyerTotal: number;
  platformFee: number;
  premiumShippingFeePesos: number;
  sellerFeePesos: number;
  sellerAmountPesos: number;
  wompiCollectionPesos: number;
  wompiPayoutPesos: number;
  truephoneRevenuePesos: number;
};

/**
 * feeRateFromKind
 *
 * Maps a fee kind to the decimal marketplace rate.
 *
 * @param kind - default (10%) or loyalty (8%).
 * @returns Decimal fee rate.
 * @calledBy computeFees, order creation
 */
export function feeRateFromKind(kind: FeeRateKind = "default") {
  return kind === "loyalty" ? LOYALTY_FEE_RATE : MARKETPLACE_FEE_RATE;
}

/**
 * feeRateBpsFromKind
 *
 * Maps a fee kind to basis-point rate.
 *
 * @param kind - default or loyalty.
 * @returns Fee rate in basis points.
 * @calledBy computeFees, order snapshots
 */
export function feeRateBpsFromKind(kind: FeeRateKind = "default") {
  return kind === "loyalty" ? LOYALTY_FEE_RATE_BPS : MARKETPLACE_FEE_RATE_BPS;
}

/**
 * feePercentLabel
 *
 * Converts basis points to a whole-number percent for UI.
 *
 * @param feeRateBps - Fee rate in basis points.
 * @returns Integer percent (e.g. 1000 → 10).
 * @calledBy Listing and checkout fee labels
 */
export function feePercentLabel(feeRateBps: number) {
  return Math.round(feeRateBps / 100);
}

/**
 * computeOrderFees
 *
 * Canonical fee engine (docs/FINANCIAL_MODEL.md §2.3).
 * All amounts are integer COP pesos.
 *
 * @param input.salePrice - Listing sale price in COP.
 * @param input.feeRate - Optional decimal rate override.
 * @param input.feeRateBps - Optional bps override.
 * @param input.premiumShippingFeePesos - Premium logistics deduction from seller.
 * @param input.sellerFeePesos - Additional seller-side fees.
 * @returns Full OrderFeeSnapshot including Wompi and TruePhone revenue.
 * @calledBy Order creation, settlement, cancel refund math, fees.test
 */
export function computeOrderFees(input: {
  salePrice: number;
  feeRate?: number;
  feeRateBps?: number;
  premiumShippingFeePesos?: number;
  sellerFeePesos?: number;
}): OrderFeeSnapshot {
  const salePrice = input.salePrice;
  assertNonNegativePesos(salePrice, "salePrice");

  const feeRateBps =
    input.feeRateBps ??
    (input.feeRate != null
      ? halfUpPesos(input.feeRate * 10_000)
      : MARKETPLACE_FEE_RATE_BPS);
  const feeRate = input.feeRate ?? feeRateBps / 10_000;

  const premiumShippingFeePesos = input.premiumShippingFeePesos ?? 0;
  const sellerFeePesos = input.sellerFeePesos ?? 0;
  assertNonNegativePesos(premiumShippingFeePesos, "premiumShippingFeePesos");
  assertNonNegativePesos(sellerFeePesos, "sellerFeePesos");

  const buyerTotal = halfUpPesos(salePrice * (1 + feeRate));
  const platformFee = buyerTotal - salePrice;

  const sellerAmountPesos = Math.max(
    0,
    salePrice - premiumShippingFeePesos - sellerFeePesos,
  );

  const wompiCollectionBase = halfUpPesos(buyerTotal * WOMPI_COLLECTION_RATE);
  const wompiCollectionPesos = halfUpPesos(
    wompiCollectionBase * (1 + WOMPI_IVA_RATE),
  );

  const wompiPayoutBase = halfUpPesos(sellerAmountPesos * WOMPI_PAYOUT_RATE);
  const wompiPayoutPesos = halfUpPesos(wompiPayoutBase * (1 + WOMPI_IVA_RATE));

  const truephoneRevenuePesos = Math.max(
    0,
    platformFee - wompiCollectionPesos - wompiPayoutPesos,
  );

  return {
    salePrice,
    feeRate,
    feeRateBps,
    buyerTotal,
    platformFee,
    premiumShippingFeePesos,
    sellerFeePesos,
    sellerAmountPesos,
    wompiCollectionPesos,
    wompiPayoutPesos,
    truephoneRevenuePesos,
  };
}

/**
 * computeFees
 *
 * Listing / checkout preview helper (equipment + marketplace fee only).
 * Prefer computeOrderFees when creating orders.
 *
 * @param price - Sale price in COP.
 * @param kind - default or loyalty fee kind.
 * @returns platformFee, finalPrice (buyer total), and feeRateBps.
 * @calledBy Listing price displays, checkout previews
 */
export function computeFees(
  price: number,
  kind: FeeRateKind = "default",
): { platformFee: number; finalPrice: number; feeRateBps: number } {
  const snapshot = computeOrderFees({
    salePrice: price,
    feeRate: feeRateFromKind(kind),
    feeRateBps: feeRateBpsFromKind(kind),
  });
  return {
    platformFee: snapshot.platformFee,
    finalPrice: snapshot.buyerTotal,
    feeRateBps: snapshot.feeRateBps,
  };
}

/**
 * buyerCancelRefundPesos
 *
 * Buyer cancel after payment: refund = B − WompiCollection.
 *
 * @param input.buyerTotal - Amount charged to buyer.
 * @param input.wompiCollectionPesos - Non-refundable Wompi collection with IVA.
 * @returns Refundable COP amount (floored at 0).
 * @calledBy Cancel authorization paths
 */
export function buyerCancelRefundPesos(input: {
  buyerTotal: number;
  wompiCollectionPesos: number;
}) {
  return Math.max(0, input.buyerTotal - input.wompiCollectionPesos);
}
