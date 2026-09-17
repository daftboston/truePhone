/**
 * @file restocking-fee-policy.test.ts
 * @description Unit tests for prohibited restocking-fee language detection.
 * @dependencies node:test, @/lib/listings/restocking-fee-policy
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  detectRestockingFeeLanguage,
  scanListingForRestockingFeeLanguage,
} from "@/lib/listings/restocking-fee-policy";

describe("restocking fee policy detection", () => {
  it("flags Spanish restocking phrases", () => {
    assert.equal(
      detectRestockingFeeLanguage(
        "Cobro cuota de reposición si cancelas después del pago.",
      ),
      true,
    );
    assert.equal(
      detectRestockingFeeLanguage("Penalidad por arrepentimiento del 10%"),
      true,
    );
    assert.equal(
      detectRestockingFeeLanguage(
        "Descuento sobre el reembolso por devolución",
      ),
      true,
    );
    assert.equal(
      detectRestockingFeeLanguage("Cargo por devolución voluntaria del 15%"),
      true,
    );
  });

  it("ignores neutral listing copy and replacement-part wording", () => {
    assert.equal(
      detectRestockingFeeLanguage("iPhone en excelente estado, incluye caja."),
      false,
    );
    assert.equal(
      detectRestockingFeeLanguage("Pantalla de reposición recién cambiada."),
      false,
    );
    assert.equal(
      detectRestockingFeeLanguage("Batería de reposición al 92%."),
      false,
    );
  });

  it("scans title and description together", () => {
    assert.equal(
      scanListingForRestockingFeeLanguage({
        title: "iPhone 14 Pro",
        description: "Cargo por devolución voluntaria del 15%",
      }),
      true,
    );
    assert.equal(
      scanListingForRestockingFeeLanguage({
        title: "iPhone 13 · pantalla de reposición",
        description: "Equipo en buen estado.",
      }),
      false,
    );
  });
});
