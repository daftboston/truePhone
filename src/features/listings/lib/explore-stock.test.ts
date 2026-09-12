/**
 * @file explore-stock.test.ts
 * @description Unit tests for Explorar stock copy (count and floor price).
 * @dependencies node:test, node:assert/strict, @/features/listings/lib/explore-stock
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatExploreModelStock,
  formatExploreSeriesModelCount,
} from "@/features/listings/lib/explore-stock";

describe("formatExploreModelStock", () => {
  it("labels empty inventory", () => {
    assert.equal(
      formatExploreModelStock({ count: 0, minBuyerPrice: null }),
      "Sin anuncios",
    );
  });

  it("labels a single listing without a floor phrase", () => {
    assert.equal(
      formatExploreModelStock({ count: 1, minBuyerPrice: 3_000_000 }),
      "1 anuncio",
    );
  });

  it("shows count and floor for several listings", () => {
    const line = formatExploreModelStock({
      count: 4,
      minBuyerPrice: 2_500_000,
    });
    assert.match(line, /^4 anuncios · desde /);
    assert.match(line, /2\.500\.000/);
  });
});

describe("formatExploreSeriesModelCount", () => {
  it("does not call catalog rows revisados", () => {
    assert.equal(formatExploreSeriesModelCount(1), "1 modelo");
    assert.equal(formatExploreSeriesModelCount(8), "8 modelos");
  });
});
