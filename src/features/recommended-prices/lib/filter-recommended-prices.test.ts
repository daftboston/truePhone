/**
 * @file filter-recommended-prices.test.ts
 * @description Unit tests for admin recommended-price search.
 * @dependencies node:test, node:assert/strict, ./filter-recommended-prices
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { filterRecommendedPrices } from "./filter-recommended-prices";

const rows = [
  {
    id: "1",
    iphoneModel: { name: "iPhone 16" },
    iphoneStorage: { valueGb: 128 },
    condition: "EXCELLENT",
  },
  {
    id: "2",
    iphoneModel: { name: "iPhone 15 Pro" },
    iphoneStorage: { valueGb: 256 },
    condition: "GOOD",
  },
];

describe("filterRecommendedPrices", () => {
  it("returns all rows when the query is blank", () => {
    assert.equal(filterRecommendedPrices(rows, "  ").length, 2);
  });

  it("matches model name, storage, or condition", () => {
    assert.deepEqual(
      filterRecommendedPrices(rows, "15 pro").map((row) => row.id),
      ["2"],
    );
    assert.deepEqual(
      filterRecommendedPrices(rows, "128").map((row) => row.id),
      ["1"],
    );
    assert.deepEqual(
      filterRecommendedPrices(rows, "good").map((row) => row.id),
      ["2"],
    );
  });
});
