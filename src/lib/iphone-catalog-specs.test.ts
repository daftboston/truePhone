/**
 * @file iphone-catalog-specs.test.ts
 * @description Ensures every active catalog model has published hardware specs.
 * @dependencies node:test, node:assert/strict, iphone-catalog-data, iphone-catalog-specs
 * @changelog 2026-09-15 — Assert canonical unique-feature names and mAh-only battery copy.
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
      assert.ok(specs.displayMarketingName.length > 0, model.slug);
      assert.ok(specs.chipBadge.length > 0, model.slug);
      assert.ok(specs.cameraHeadline.length > 0, model.slug);
      assert.ok(specs.batteryPrimaryLabel.length > 0, model.slug);
    }
  });

  it("includes iPhone 12 mini specs used on model browse", () => {
    const specs = getRequiredCatalogModelSpecs("iphone-12-mini");
    assert.equal(specs.displaySizeInches, 5.4);
    assert.match(specs.resolution, /2340 × 1080/);
    assert.equal(specs.chip, "Apple A14 Bionic");
    assert.equal(specs.ramGb, 4);
    assert.equal(specs.batteryMah, 2227);
    assert.equal(specs.displayMarketingName, "Pantalla Super Retina XDR");
    assert.equal(specs.chipBadge, "A14");
    assert.equal(specs.batteryPrimaryLabel, "2.227 mAh");
    assert.equal(specs.batterySecondaryLabel, undefined);
    assert.equal(specs.cameraModuleVariant, "dual");
  });

  it("lists titanium, Camera Control, and Action Button on iPhone 16 Pro models", () => {
    for (const slug of ["iphone-16-pro", "iphone-16-pro-max"]) {
      const features = getRequiredCatalogModelSpecs(slug).uniqueFeatures;
      assert.ok(features.includes("Titanio"), slug);
      assert.ok(features.includes("Control de Cámara"), slug);
      assert.ok(features.includes("Botón de Acción"), slug);
    }
  });

  it("keeps Action Button on iPhone 15 Pro Max and iPhone 16 Plus", () => {
    assert.ok(
      getRequiredCatalogModelSpecs("iphone-15-pro-max").uniqueFeatures.includes(
        "Botón de Acción",
      ),
    );
    assert.ok(
      getRequiredCatalogModelSpecs("iphone-16-plus").uniqueFeatures.includes(
        "Botón de Acción",
      ),
    );
  });

  it("keeps every active model within the compare feature bullet range", () => {
    for (const model of IPHONE_CATALOG_MODELS) {
      const count = getRequiredCatalogModelSpecs(model.slug).uniqueFeatures
        .length;
      assert.ok(
        count >= 3 && count <= 5,
        `${model.slug} has ${count} unique feature bullets`,
      );
    }
  });

  it("shows battery capacity as mAh without video-playback copy", () => {
    for (const model of IPHONE_CATALOG_MODELS) {
      const specs = getRequiredCatalogModelSpecs(model.slug);
      assert.match(specs.batteryPrimaryLabel, /^\d{1,3}(?:\.\d{3})* mAh$/);
      assert.doesNotMatch(specs.batteryPrimaryLabel, /hasta/i);
      assert.equal(specs.batterySecondaryLabel, undefined);
    }
  });

  it("uses one canonical name when models share the same unique feature", () => {
    const forbiddenAliases = [
      "Diseño de titanio",
      "Marco de titanio",
      "Botón de Acción y USB-C",
      "Face ID y Botón de Acción",
      "Ceramic Shield y MagSafe",
      "MagSafe de 15 W",
      "Teleobjetivo con zoom óptico 2,5×",
      "Teleobjetivo con zoom óptico 3×",
      "Zoom óptico hasta 8×",
      "Macro photography",
    ];
    const canonicalShared = [
      "Titanio",
      "Botón de Acción",
      "MagSafe",
      "Ceramic Shield",
      "Ceramic Shield 2",
      "USB-C",
      "Control de Cámara",
      "ProMotion hasta 120 Hz",
      "Always-On display",
      "Dynamic Island",
      "Apple Intelligence",
      "Face ID",
      "5G",
    ];

    const catalogFeatures = IPHONE_CATALOG_MODELS.flatMap(
      (model) => getRequiredCatalogModelSpecs(model.slug).uniqueFeatures,
    );
    const uniqueNames = [...new Set(catalogFeatures)];

    for (const alias of forbiddenAliases) {
      assert.equal(
        uniqueNames.includes(alias),
        false,
        `alias still in catalog: ${alias}`,
      );
    }

    for (const name of canonicalShared) {
      assert.ok(
        uniqueNames.includes(name),
        `missing canonical feature name: ${name}`,
      );
    }

    const allowedQualifiedNames = new Set([
      "USB-C con Thunderbolt",
      "Ceramic Shield 2",
    ]);
    for (const name of canonicalShared) {
      const nearDuplicates = uniqueNames.filter(
        (other) =>
          other !== name &&
          other.toLowerCase().includes(name.toLowerCase()) &&
          !allowedQualifiedNames.has(other),
      );
      assert.deepEqual(
        nearDuplicates,
        [],
        `near-duplicate of ${name}: ${nearDuplicates.join(", ")}`,
      );
    }
  });
});
