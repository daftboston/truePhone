/**
 * @file listing-security.test.ts
 * @description Unit tests for Colombian operator matching and security schema.
 * @dependencies node:test, node:assert/strict, @/features/listings/schemas/listing
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  matchColombianOperator,
  resolveListingCarrier,
  updateListingSecuritySchema,
} from "@/features/listings/schemas/listing";

const validImei = "356938035643809";

describe("matchColombianOperator", () => {
  it("canonicalizes a known operator regardless of case", () => {
    assert.equal(matchColombianOperator("claro"), "Claro");
    assert.equal(matchColombianOperator("  TIGO  "), "Tigo");
  });

  it("returns null for unknown or empty values", () => {
    assert.equal(matchColombianOperator(""), null);
    assert.equal(matchColombianOperator("Verizon"), null);
  });
});

describe("resolveListingCarrier", () => {
  it("clears the carrier when the device is unlocked", () => {
    assert.equal(resolveListingCarrier("true", "Claro"), null);
  });

  it("keeps a known operator when the device is locked", () => {
    assert.equal(resolveListingCarrier("false", "movistar"), "Movistar");
  });
});

describe("updateListingSecuritySchema", () => {
  it("requires a Colombian operator when locked to a carrier", () => {
    const parsed = updateListingSecuritySchema.safeParse({
      imei: validImei,
      activationLocked: "false",
      unlocked: "false",
      carrier: "",
    });
    assert.equal(parsed.success, false);
  });

  it("accepts a known operator when locked to a carrier", () => {
    const parsed = updateListingSecuritySchema.safeParse({
      imei: validImei,
      activationLocked: "false",
      unlocked: "false",
      carrier: "WOM",
    });
    assert.equal(parsed.success, true);
  });

  it("allows an empty carrier when the device is unlocked", () => {
    const parsed = updateListingSecuritySchema.safeParse({
      imei: validImei,
      activationLocked: "false",
      unlocked: "true",
      carrier: "",
    });
    assert.equal(parsed.success, true);
  });
});
