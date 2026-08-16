/**
 * @file eligibility.ts
 * @description Premium Bogotá shipping eligibility rules (docs/SHIPPING.md).
 * @dependencies @/lib/locations/colombia-cities
 */

import {
  CITY_BOGOTA,
  resolveCityFormState,
} from "@/lib/locations/colombia-cities";

/**
 * normalizeCity
 *
 * Normalizes city strings for comparison (NFD strip, lower, collapse spaces).
 *
 * @param city - Raw city string or nullish.
 * @returns Normalized lowercase city string, or empty when missing.
 * @calledBy City comparison helpers and tests
 */
export function normalizeCity(city: string | null | undefined): string {
  if (!city) return "";
  return city
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/,/g, "");
}

/**
 * isBogotaCity
 *
 * True only for Bogotá city proper.
 * "Alrededores de Bogotá", Soacha, etc. → false (Carrier only).
 *
 * @param city - Persisted or free-text seller city.
 * @returns True when city is canonical Bogotá.
 * @calledBy availableShippingMethods, canSwitchCarrierToPremium, canSwitchPremiumToCarrier
 */
export function isBogotaCity(city: string | null | undefined): boolean {
  if (!city) return false;
  if (city === CITY_BOGOTA) return true;
  // Legacy free-text until the user re-saves via the location selects.
  return resolveCityFormState(city).cityOption === CITY_BOGOTA;
}

export type ShippingMethodOption = "PREMIUM_BOGOTA" | "CARRIER";

/**
 * availableShippingMethods
 *
 * Lists shipping methods allowed for a seller city.
 *
 * @param sellerCity - Seller profile city.
 * @returns Premium+Carrier in Bogotá; Carrier only elsewhere.
 * @calledBy Checkout shipping selection UI
 */
export function availableShippingMethods(
  sellerCity: string | null | undefined,
): ShippingMethodOption[] {
  if (isBogotaCity(sellerCity)) {
    return ["PREMIUM_BOGOTA", "CARRIER"];
  }
  return ["CARRIER"];
}

/**
 * canSelectShippingMethod
 *
 * Checks whether a method is allowed for the seller city.
 *
 * @param sellerCity - Seller profile city.
 * @param method - Requested shipping method.
 * @returns True when method is in availableShippingMethods.
 * @calledBy selectShippingMethod validation
 */
export function canSelectShippingMethod(
  sellerCity: string | null | undefined,
  method: ShippingMethodOption,
): boolean {
  return availableShippingMethods(sellerCity).includes(method);
}

type SwitchableShipment = {
  method: string;
  trackingCode: string | null;
  deliveredAt: Date | null;
  status: string;
  inspection?: { result: string } | null;
};

/**
 * canSwitchCarrierToPremium
 *
 * Bogotá seller may switch Carrier → Premium only before tracking is saved.
 *
 * @param input.sellerCity - Seller profile city.
 * @param input.shipment - Current shipment row snapshot (or null).
 * @returns True when switch is still allowed.
 * @calledBy switchCarrierToPremium and shipping UI
 */
export function canSwitchCarrierToPremium(input: {
  sellerCity: string | null | undefined;
  shipment: SwitchableShipment | null;
}): boolean {
  if (!input.shipment) return false;
  if (!isBogotaCity(input.sellerCity)) return false;
  if (input.shipment.method !== "CARRIER") return false;
  if (input.shipment.deliveredAt) return false;
  if (input.shipment.trackingCode?.trim()) return false;
  if (
    input.shipment.status === "FAILED" ||
    input.shipment.status === "RETURNED" ||
    input.shipment.status === "IN_TRANSIT" ||
    input.shipment.status === "DELIVERED"
  ) {
    return false;
  }
  return true;
}

/**
 * canSwitchPremiumToCarrier
 *
 * Bogotá seller may switch Premium → Carrier until logistics are committed:
 * no PASSED/FAILED inspection, still AWAITING_PICKUP or METHOD_SELECTED.
 *
 * @param input.sellerCity - Seller profile city.
 * @param input.shipment - Current shipment row snapshot (or null).
 * @returns True when switch is still allowed.
 * @calledBy switchPremiumToCarrier and shipping UI
 */
export function canSwitchPremiumToCarrier(input: {
  sellerCity: string | null | undefined;
  shipment: SwitchableShipment | null;
}): boolean {
  if (!input.shipment) return false;
  if (!isBogotaCity(input.sellerCity)) return false;
  if (input.shipment.method !== "PREMIUM_BOGOTA") return false;
  if (input.shipment.deliveredAt) return false;
  if (input.shipment.inspection?.result === "PASSED") return false;
  if (input.shipment.inspection?.result === "FAILED") return false;
  return (
    input.shipment.status === "AWAITING_PICKUP" ||
    input.shipment.status === "METHOD_SELECTED"
  );
}
