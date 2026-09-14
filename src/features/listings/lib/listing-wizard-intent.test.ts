/**
 * @file listing-wizard-intent.test.ts
 * @description Unit tests for Guardar y salir vs Continuar redirects.
 * @dependencies node:test, node:assert/strict, @/features/listings/lib/listing-wizard-intent
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  LISTING_SAVE_EXIT_PATH,
  listingWizardNextPath,
} from "@/features/listings/lib/listing-wizard-intent";

describe("listingWizardNextPath", () => {
  it("sends save_exit to the seller hub without mutating sibling paths", () => {
    const continuePath = "/vender/listing-a/fotos";
    assert.equal(
      listingWizardNextPath("save_exit", continuePath),
      LISTING_SAVE_EXIT_PATH,
    );
    assert.equal(continuePath, "/vender/listing-a/fotos");
  });

  it("keeps Continuar on the next wizard step", () => {
    assert.equal(
      listingWizardNextPath(null, "/vender/listing-a/fotos"),
      "/vender/listing-a/fotos",
    );
    assert.equal(
      listingWizardNextPath("continue", "/vender/listing-a/seguridad"),
      "/vender/listing-a/seguridad",
    );
  });
});
