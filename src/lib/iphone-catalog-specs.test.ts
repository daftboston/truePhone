/**
 * @file iphone-catalog-specs.test.ts
 * @description Ensures every active catalog model has published hardware specs.
 * @dependencies node:test, node:assert/strict, iphone-catalog-data, iphone-catalog-specs
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  IPHONE_CATALOG_MODELS,
  IPHONE_CATALOG_RETIRED_SLUGS,
} from "@/lib/iphone-catalog-data";
import {
  CATALOG_SPECS_SLUGS,
  getCatalogModelSpecs,
  getRequiredCatalogModelSpecs,
} from "@/lib/iphone-catalog-specs";

describe("iphone catalog specs", () => {
  it("covers every active catalog slug and excludes retired models", () => {
    assert.deepEqual(CATALOG_SPECS_SLUGS, [
      ...IPHONE_CATALOG_MODELS.map((model) => model.slug),
    ]);
    assert.equal(CATALOG_SPECS_SLUGS.length, 28);

    for (const slug of CATALOG_SPECS_SLUGS) {
      assert.ok(getCatalogModelSpecs(slug), slug);
    }

    for (const slug of IPHONE_CATALOG_RETIRED_SLUGS) {
      assert.equal(getCatalogModelSpecs(slug), null, slug);
    }
  });

  it("requires core hardware fields for each active model", () => {
    for (const model of IPHONE_CATALOG_MODELS) {
      const specs = getRequiredCatalogModelSpecs(model.slug);
      assert.ok(specs.displaySizeInches > 0, model.slug);
      assert.ok(specs.resolution.length > 0, model.slug);
      assert.ok(specs.chip.length > 0, model.slug);
      assert.ok(specs.cameras.length > 0, model.slug);
      assert.ok(specs.uniqueFeatures.length > 0, model.slug);
    }
  });

  it("includes iPhone 12 mini specs used on model browse", () => {
    const specs = getRequiredCatalogModelSpecs("iphone-12-mini");
    assert.equal(specs.displaySizeInches, 5.4);
    assert.match(specs.resolution, /2340 × 1080/);
    assert.equal(specs.chip, "Apple A14 Bionic");
    assert.equal(specs.ramGb, 4);
    assert.equal(specs.batteryMah, 2227);
  });
});
