/**
 * @file eligibility.test.ts
 * @description Unit tests for Bogotá Premium shipping eligibility.
 * @dependencies node:test, @/lib/locations/colombia-cities, @/lib/shipping/eligibility
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CITY_BOGOTA,
  CITY_BOGOTA_SURROUNDINGS,
  CITY_OTHER,
  DEPARTMENT_BOGOTA_DC,
  resolvePersistedCity,
} from "@/lib/locations/colombia-cities";
import {
  availableShippingMethods,
  canSelectShippingMethod,
  canSwitchCarrierToPremium,
  canSwitchPremiumToCarrier,
  isBogotaCity,
} from "@/lib/shipping/eligibility";

describe("shipping Bogotá eligibility", () => {
  it("accepts only canonical Bogotá for Premium", () => {
    assert.equal(isBogotaCity(CITY_BOGOTA), true);
    assert.equal(isBogotaCity(CITY_BOGOTA_SURROUNDINGS), false);
    assert.equal(isBogotaCity("Medellín"), false);
    assert.equal(isBogotaCity("Soacha"), false);
    assert.equal(isBogotaCity(null), false);
  });

  it("maps Bogotá D.C. department to persisted Bogotá city", () => {
    assert.equal(
      resolvePersistedCity({
        department: DEPARTMENT_BOGOTA_DC,
        cityOption: CITY_OTHER,
        cityDetail: "Anything",
      }),
      CITY_BOGOTA,
    );
  });

  it("persists free-text for Otra and Alrededores", () => {
    assert.equal(
      resolvePersistedCity({
        department: "Cundinamarca",
        cityOption: CITY_BOGOTA_SURROUNDINGS,
        cityDetail: "Soacha",
      }),
      "Soacha",
    );
    assert.equal(
      resolvePersistedCity({
        department: "Antioquia",
        cityOption: CITY_OTHER,
        cityDetail: "Envigado",
      }),
      "Envigado",
    );
  });

  it("offers Premium only in Bogotá", () => {
    assert.deepEqual(availableShippingMethods(CITY_BOGOTA), [
      "PREMIUM_BOGOTA",
      "CARRIER",
    ]);
    assert.deepEqual(availableShippingMethods("Soacha"), ["CARRIER"]);
    assert.equal(canSelectShippingMethod("Cali", "PREMIUM_BOGOTA"), false);
    assert.equal(canSelectShippingMethod(CITY_BOGOTA, "PREMIUM_BOGOTA"), true);
  });

  it("allows Carrier → Premium until tracking is saved", () => {
    assert.equal(
      canSwitchCarrierToPremium({
        sellerCity: CITY_BOGOTA,
        shipment: {
          method: "CARRIER",
          trackingCode: null,
          deliveredAt: null,
          status: "METHOD_SELECTED",
        },
      }),
      true,
    );
    assert.equal(
      canSwitchCarrierToPremium({
        sellerCity: CITY_BOGOTA,
        shipment: {
          method: "CARRIER",
          trackingCode: "ABC12345",
          deliveredAt: null,
          status: "IN_TRANSIT",
        },
      }),
      false,
    );
    assert.equal(
      canSwitchCarrierToPremium({
        sellerCity: "Medellín",
        shipment: {
          method: "CARRIER",
          trackingCode: null,
          deliveredAt: null,
          status: "METHOD_SELECTED",
        },
      }),
      false,
    );
  });

  it("allows Premium → Carrier until inspection commitment", () => {
    assert.equal(
      canSwitchPremiumToCarrier({
        sellerCity: CITY_BOGOTA,
        shipment: {
          method: "PREMIUM_BOGOTA",
          trackingCode: null,
          deliveredAt: null,
          status: "AWAITING_PICKUP",
          inspection: { result: "PENDING" },
        },
      }),
      true,
    );
    assert.equal(
      canSwitchPremiumToCarrier({
        sellerCity: CITY_BOGOTA,
        shipment: {
          method: "PREMIUM_BOGOTA",
          trackingCode: null,
          deliveredAt: null,
          status: "AWAITING_PICKUP",
          inspection: { result: "PASSED" },
        },
      }),
      false,
    );
    assert.equal(
      canSwitchPremiumToCarrier({
        sellerCity: CITY_BOGOTA,
        shipment: {
          method: "PREMIUM_BOGOTA",
          trackingCode: null,
          deliveredAt: null,
          status: "IN_TRANSIT",
          inspection: { result: "PENDING" },
        },
      }),
      false,
    );
    assert.equal(
      canSwitchPremiumToCarrier({
        sellerCity: CITY_BOGOTA,
        shipment: {
          method: "PREMIUM_BOGOTA",
          trackingCode: null,
          deliveredAt: null,
          status: "FAILED",
          inspection: { result: "FAILED" },
        },
      }),
      false,
    );
  });
});
