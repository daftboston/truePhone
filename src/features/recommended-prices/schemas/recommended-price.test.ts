/**
 * @file recommended-price.test.ts
 * @description Unit tests for recommended price schema and effective-window helper.
 * @dependencies node:test, node:assert/strict, recommended-price schema, recommended-prices lib
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Condition } from "@prisma/client";

import { recommendedPriceSchema } from "@/features/recommended-prices/schemas/recommended-price";
import { isRecommendedPriceEffective } from "@/lib/recommended-prices";

describe("recommendedPriceSchema", () => {
  const base = {
    iphoneModelId: "model_1",
    iphoneStorageId: "storage_1",
    condition: Condition.GOOD,
    priceCop: "2500000",
  };

  it("accepts a valid reference price", () => {
    const parsed = recommendedPriceSchema.safeParse(base);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.priceCop, 2_500_000);
    }
  });

  it("rejects when min exceeds max", () => {
    const parsed = recommendedPriceSchema.safeParse({
      ...base,
      minPriceCop: "3000000",
      maxPriceCop: "2000000",
    });
    assert.equal(parsed.success, false);
  });

  it("parses optional effective dates from YYYY-MM-DD", () => {
    const parsed = recommendedPriceSchema.safeParse({
      ...base,
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.ok(
        parsed.data.effectiveFrom?.toISOString().startsWith("2026-01-01"),
      );
      assert.ok(
        parsed.data.effectiveTo?.toISOString().startsWith("2026-12-31"),
      );
    }
  });
});

describe("isRecommendedPriceEffective", () => {
  const at = new Date("2026-06-15T12:00:00.000Z");

  it("treats open-ended rows as effective", () => {
    assert.equal(
      isRecommendedPriceEffective(
        { effectiveFrom: null, effectiveTo: null },
        at,
      ),
      true,
    );
  });

  it("returns false before effectiveFrom", () => {
    assert.equal(
      isRecommendedPriceEffective(
        {
          effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
          effectiveTo: null,
        },
        at,
      ),
      false,
    );
  });

  it("returns false after effectiveTo", () => {
    assert.equal(
      isRecommendedPriceEffective(
        {
          effectiveFrom: null,
          effectiveTo: new Date("2026-05-01T00:00:00.000Z"),
        },
        at,
      ),
      false,
    );
  });
});
