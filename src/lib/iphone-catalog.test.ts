/**
 * @file iphone-catalog.test.ts
 * @description Guards the 28-model catalog, product-line grouping, and typeahead matching.
 * @dependencies node:test, node:assert/strict, iphone-catalog, iphone-catalog-data
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatStorageLabel,
  groupModelsBySeries,
  matchModelsForSearch,
  type CatalogModel,
} from "@/lib/iphone-catalog";
import {
  IPHONE_CATALOG_COLORS,
  IPHONE_CATALOG_MODELS,
} from "@/lib/iphone-catalog-data";

const REQUIRED_SLUGS = [
  "iphone-se-2",
  "iphone-12-mini",
  "iphone-12",
  "iphone-12-pro",
  "iphone-12-pro-max",
  "iphone-13-mini",
  "iphone-13",
  "iphone-13-pro",
  "iphone-13-pro-max",
  "iphone-se-3",
  "iphone-14",
  "iphone-14-plus",
  "iphone-14-pro",
  "iphone-14-pro-max",
  "iphone-15",
  "iphone-15-plus",
  "iphone-15-pro",
  "iphone-15-pro-max",
  "iphone-16",
  "iphone-16-plus",
  "iphone-16-pro",
  "iphone-16-pro-max",
  "iphone-16e",
  "iphone-17",
  "iphone-air",
  "iphone-17-pro",
  "iphone-17-pro-max",
  "iphone-17e",
] as const;

/**
 * toCatalogModels
 *
 * Maps seed rows to CatalogModel shapes for grouping/search tests.
 *
 * @returns CatalogModel list with stable fake ids.
 */
function toCatalogModels(): CatalogModel[] {
  return IPHONE_CATALOG_MODELS.map((model) => ({
    id: model.slug,
    name: model.name,
    slug: model.slug,
    productLine: model.productLine,
    generation: model.generation,
    variantType: model.variantType,
    releaseYear: model.releaseYear,
  }));
}

describe("IPHONE_CATALOG_MODELS", () => {
  it("contains exactly the 28 required models", () => {
    assert.equal(IPHONE_CATALOG_MODELS.length, 28);
    assert.deepEqual(
      IPHONE_CATALOG_MODELS.map((model) => model.slug),
      [...REQUIRED_SLUGS],
    );
  });

  it("keeps unique slugs, names, and product-line/generation/variant triples", () => {
    const slugs = IPHONE_CATALOG_MODELS.map((model) => model.slug);
    const names = IPHONE_CATALOG_MODELS.map((model) => model.name);
    const triples = IPHONE_CATALOG_MODELS.map(
      (model) =>
        `${model.productLine}:${model.generation}:${model.variantType}`,
    );
    assert.equal(new Set(slugs).size, 28);
    assert.equal(new Set(names).size, 28);
    assert.equal(new Set(triples).size, 28);
  });

  it("does not assign SE models to numbered iPhone generations", () => {
    const seModels = IPHONE_CATALOG_MODELS.filter(
      (model) => model.productLine === "IPHONE_SE",
    );
    assert.equal(seModels.length, 2);
    assert.deepEqual(seModels.map((model) => model.slug).sort(), [
      "iphone-se-2",
      "iphone-se-3",
    ]);
    for (const model of seModels) {
      assert.equal(model.variantType, "STANDARD");
      assert.ok(model.generation === 2 || model.generation === 3);
      assert.notEqual(model.generation, 13);
      assert.notEqual(model.generation, 14);
    }
  });

  it("treats iPhone Air as its own product line, not iPhone 17", () => {
    const air = IPHONE_CATALOG_MODELS.find(
      (model) => model.slug === "iphone-air",
    );
    assert.ok(air);
    assert.equal(air.productLine, "IPHONE_AIR");
    assert.equal(air.variantType, "AIR");
    assert.equal(air.generation, 1);
    assert.equal(air.releaseYear, 2025);
  });

  it("places 16e and 17e on the numbered iPhone line of their family", () => {
    const sixteenE = IPHONE_CATALOG_MODELS.find(
      (model) => model.slug === "iphone-16e",
    );
    const seventeenE = IPHONE_CATALOG_MODELS.find(
      (model) => model.slug === "iphone-17e",
    );
    assert.ok(sixteenE && seventeenE);
    assert.equal(sixteenE.productLine, "IPHONE");
    assert.equal(sixteenE.generation, 16);
    assert.equal(sixteenE.variantType, "E");
    assert.equal(seventeenE.productLine, "IPHONE");
    assert.equal(seventeenE.generation, 17);
    assert.equal(seventeenE.variantType, "E");
  });

  it("only references colors that exist in the color catalog", () => {
    const colorNames = new Set(
      IPHONE_CATALOG_COLORS.map((color) => color.name),
    );
    for (const model of IPHONE_CATALOG_MODELS) {
      assert.ok(model.colorNames.length > 0, model.slug);
      assert.ok(model.storageGb.length > 0, model.slug);
      for (const colorName of model.colorNames) {
        assert.equal(
          colorNames.has(colorName),
          true,
          `${model.slug}:${colorName}`,
        );
      }
    }
  });
});

describe("groupModelsBySeries", () => {
  const seriesList = groupModelsBySeries(toCatalogModels());
  const byKey = new Map(seriesList.map((series) => [series.key, series]));

  it("groups SE on its own series and never under 13 or 14", () => {
    const se = byKey.get("se");
    assert.ok(se);
    assert.equal(se.label, "Serie iPhone SE");
    assert.deepEqual(se.models.map((model) => model.slug).sort(), [
      "iphone-se-2",
      "iphone-se-3",
    ]);
    assert.equal(
      byKey
        .get("13")
        ?.models.some((model) => model.productLine === "IPHONE_SE"),
      false,
    );
    assert.equal(
      byKey
        .get("14")
        ?.models.some((model) => model.productLine === "IPHONE_SE"),
      false,
    );
  });

  it("keeps iPhone Air off the iPhone 17 series", () => {
    const air = byKey.get("air");
    const seventeen = byKey.get("17");
    assert.ok(air && seventeen);
    assert.deepEqual(
      air.models.map((model) => model.slug),
      ["iphone-air"],
    );
    assert.equal(
      seventeen.models.some((model) => model.slug === "iphone-air"),
      false,
    );
    assert.deepEqual(
      seventeen.models.map((model) => model.slug),
      ["iphone-17", "iphone-17-pro", "iphone-17-pro-max", "iphone-17e"],
    );
  });
});

describe("matchModelsForSearch", () => {
  const models = toCatalogModels();

  it("returns only SE models for se queries, including generation narrowing", () => {
    const se = matchModelsForSearch(models, "iphone se");
    assert.deepEqual(se.map((model) => model.slug).sort(), [
      "iphone-se-2",
      "iphone-se-3",
    ]);
    assert.deepEqual(
      matchModelsForSearch(models, "se 3").map((model) => model.slug),
      ["iphone-se-3"],
    );
  });

  it("does not include SE when searching a numbered generation", () => {
    const thirteen = matchModelsForSearch(models, "iphone 13");
    assert.equal(
      thirteen.some((model) => model.productLine === "IPHONE_SE"),
      false,
    );
    assert.ok(thirteen.some((model) => model.slug === "iphone-13-mini"));
  });

  it("finds Air by name and excludes it from iPhone 17 queries", () => {
    assert.deepEqual(
      matchModelsForSearch(models, "air").map((model) => model.slug),
      ["iphone-air"],
    );
    assert.equal(
      matchModelsForSearch(models, "iphone 17").some(
        (model) => model.slug === "iphone-air",
      ),
      false,
    );
  });

  it("returns the 16 family including 16e, and 16e alone for 16e", () => {
    const sixteen = matchModelsForSearch(models, "iphone 16");
    assert.ok(sixteen.some((model) => model.slug === "iphone-16e"));
    assert.deepEqual(
      matchModelsForSearch(models, "16e").map((model) => model.slug),
      ["iphone-16e"],
    );
  });
});

describe("formatStorageLabel", () => {
  it("formats TB capacities without showing raw 1024 GB", () => {
    assert.equal(formatStorageLabel(256), "256 GB");
    assert.equal(formatStorageLabel(1024), "1 TB");
    assert.equal(formatStorageLabel(2048), "2 TB");
  });
});
