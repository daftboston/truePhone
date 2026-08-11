/**
 * @file shipping-schemas.test.ts
 * @description Unit tests for carrier tracking form resolution and Zod schemas.
 * @dependencies node:test, node:assert/strict, @/features/shipping/schemas/shipping
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolveCarrierNameFromForm,
  uploadCarrierTrackingSchema,
} from "@/features/shipping/schemas/shipping";

describe("resolveCarrierNameFromForm", () => {
  it("returns known carrier option as-is", () => {
    assert.equal(
      resolveCarrierNameFromForm("Servientrega", "ignored"),
      "Servientrega",
    );
  });

  it("uses the custom name when option is Otro", () => {
    assert.equal(
      resolveCarrierNameFromForm("Otro", "  Mensajeros Urbanos  "),
      "Mensajeros Urbanos",
    );
  });

  it("returns empty when Otro has no custom name", () => {
    assert.equal(resolveCarrierNameFromForm("Otro", ""), "");
    assert.equal(resolveCarrierNameFromForm("Otro", null), "");
  });
});

describe("uploadCarrierTrackingSchema", () => {
  it("accepts a valid Servientrega tracking payload", () => {
    const parsed = uploadCarrierTrackingSchema.safeParse({
      orderId: "ord_1",
      carrierName: "Servientrega",
      trackingCode: "ABC12345",
      evidenceUrl: "",
    });
    assert.equal(parsed.success, true);
  });

  it("accepts a custom carrier name with optional evidence URL", () => {
    const parsed = uploadCarrierTrackingSchema.safeParse({
      orderId: "ord_1",
      carrierName: "Mensajeros Urbanos",
      trackingCode: "TRACK-9999",
      evidenceUrl: "https://example.com/recibo.jpg",
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.carrierName, "Mensajeros Urbanos");
      assert.equal(parsed.data.evidenceUrl, "https://example.com/recibo.jpg");
    }
  });

  it("rejects literal Otro as the persisted carrier name", () => {
    const parsed = uploadCarrierTrackingSchema.safeParse({
      orderId: "ord_1",
      carrierName: "Otro",
      trackingCode: "ABC12345",
    });
    assert.equal(parsed.success, false);
  });

  it("rejects short tracking codes", () => {
    const parsed = uploadCarrierTrackingSchema.safeParse({
      orderId: "ord_1",
      carrierName: "Envía",
      trackingCode: "12",
    });
    assert.equal(parsed.success, false);
  });
});
