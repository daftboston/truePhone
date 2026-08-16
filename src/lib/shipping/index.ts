/**
 * @file index.ts
 * @description Public barrel for shipping eligibility, labels, and shipment mutations.
 * @dependencies @/lib/shipping/eligibility, labels, shipments; see docs/SHIPPING.md
 */

export {
  isBogotaCity,
  normalizeCity,
  availableShippingMethods,
  canSelectShippingMethod,
  canSwitchCarrierToPremium,
  canSwitchPremiumToCarrier,
  type ShippingMethodOption,
} from "@/lib/shipping/eligibility";
export {
  CARRIER_OPTIONS,
  shippingMethodLabel,
  shipmentStatusLabel,
  inspectionResultLabel,
  type CarrierOption,
} from "@/lib/shipping/labels";
export {
  selectShippingMethod,
  switchCarrierToPremium,
  switchPremiumToCarrier,
  uploadCarrierTracking,
  recordPremiumInspection,
  markOrderReceivedByBuyer,
} from "@/lib/shipping/shipments";
