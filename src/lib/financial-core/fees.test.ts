/**
 * @file fees.test.ts
 * @description Unit tests for the Financial Core fee engine worked examples.
 * @dependencies node:test, @/lib/financial-core/fees
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MARKETPLACE_FEE_RATE_BPS,
  LOYALTY_FEE_RATE_BPS,
  buyerCancelRefundPesos,
  computeFees,
  computeOrderFees,
  feePercentLabel,
} from "@/lib/financial-core/fees";

describe("Financial Core fee engine", () => {
  it("snapshots 10% Carrier happy path (worked example)", () => {
    const fees = computeOrderFees({ salePrice: 2_000_000 });

    assert.equal(fees.feeRateBps, MARKETPLACE_FEE_RATE_BPS);
    assert.equal(fees.buyerTotal, 2_200_000);
    assert.equal(fees.platformFee, 200_000);
    assert.equal(fees.sellerAmountPesos, 2_000_000);
    assert.equal(fees.wompiCollectionPesos, 71_995);
    assert.equal(fees.wompiPayoutPesos, 10_710);
    assert.equal(fees.truephoneRevenuePesos, 117_295);
  });

  it("deducts Premium Bogotá fee from seller amount", () => {
    const fees = computeOrderFees({
      salePrice: 2_000_000,
      premiumShippingFeePesos: 20_000,
    });

    assert.equal(fees.buyerTotal, 2_200_000);
    assert.equal(fees.sellerAmountPesos, 1_980_000);
    assert.equal(fees.wompiPayoutPesos, 10_603);
  });

  it("supports one-time 8% loyalty rate", () => {
    const fees = computeOrderFees({
      salePrice: 2_000_000,
      feeRateBps: LOYALTY_FEE_RATE_BPS,
      feeRate: 0.08,
    });

    assert.equal(fees.feeRateBps, 800);
    assert.equal(fees.buyerTotal, 2_160_000);
    assert.equal(fees.platformFee, 160_000);
    assert.equal(feePercentLabel(fees.feeRateBps), 8);
  });

  it("buyer cancel refund absorbs Wompi collection", () => {
    const fees = computeOrderFees({ salePrice: 2_000_000 });
    const refund = buyerCancelRefundPesos({
      buyerTotal: fees.buyerTotal,
      wompiCollectionPesos: fees.wompiCollectionPesos,
    });
    assert.equal(refund, 2_200_000 - 71_995);
  });

  it("computeFees listing helper matches default 10%", () => {
    const fees = computeFees(1_000_000);
    assert.equal(fees.finalPrice, 1_100_000);
    assert.equal(fees.platformFee, 100_000);
    assert.equal(fees.feeRateBps, 1000);
  });
});
