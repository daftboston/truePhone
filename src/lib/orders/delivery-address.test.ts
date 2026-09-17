/**
 * @file delivery-address.test.ts
 * @description Unit tests for delivery address guards and formatting.
 * @dependencies node:test, @/lib/orders/delivery-address
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canRequestDeliveryAddressChange,
  deliveryAddressChangeBlockedReason,
  formatDeliveryAddressLines,
  isDeliveryAddressComplete,
} from "@/lib/orders/delivery-address";

describe("delivery address guards", () => {
  const completeOrder = {
    deliveryRecipientName: "Ana López",
    deliveryPhone: "3001234567",
    deliveryCity: "Bogotá",
    deliveryDepartment: "Bogotá D.C.",
    deliveryAddressLine: "Calle 100 # 15-20",
    deliveryNotes: "Torre 2 apto 501",
    deliveryAddressFrozenAt: new Date("2026-09-17T12:00:00Z"),
  };

  it("detects complete delivery snapshots", () => {
    assert.equal(isDeliveryAddressComplete(completeOrder), true);
    assert.equal(
      isDeliveryAddressComplete({
        ...completeOrder,
        deliveryAddressLine: "",
      }),
      false,
    );
  });

  it("formats delivery lines for UI", () => {
    assert.deepEqual(formatDeliveryAddressLines(completeOrder), [
      "Ana López",
      "3001234567",
      "Calle 100 # 15-20, Bogotá, Bogotá D.C.",
      "Notas: Torre 2 apto 501",
    ]);
  });

  it("allows change before carrier tracking or Premium", () => {
    assert.equal(
      canRequestDeliveryAddressChange({
        orderStatus: "PAID",
        deliveryAddressFrozenAt: completeOrder.deliveryAddressFrozenAt,
        shipment: null,
        hasPendingChange: false,
      }),
      true,
    );
    assert.equal(
      canRequestDeliveryAddressChange({
        orderStatus: "PAID",
        deliveryAddressFrozenAt: completeOrder.deliveryAddressFrozenAt,
        shipment: {
          method: "CARRIER",
          status: "METHOD_SELECTED",
          trackingCode: null,
          trackingUploadedAt: null,
          evidenceUrl: null,
        },
        hasPendingChange: false,
      }),
      true,
    );
  });

  it("blocks change when tracking exists", () => {
    const reason = deliveryAddressChangeBlockedReason({
      orderStatus: "PAID",
      deliveryAddressFrozenAt: completeOrder.deliveryAddressFrozenAt,
      shipment: {
        method: "CARRIER",
        status: "IN_TRANSIT",
        trackingCode: "ABC123",
        trackingUploadedAt: new Date(),
        evidenceUrl: null,
      },
      hasPendingChange: false,
    });
    assert.match(reason ?? "", /rastreo|guía/i);
  });

  it("blocks change when Premium is in progress", () => {
    const reason = deliveryAddressChangeBlockedReason({
      orderStatus: "PAID",
      deliveryAddressFrozenAt: completeOrder.deliveryAddressFrozenAt,
      shipment: {
        method: "PREMIUM_BOGOTA",
        status: "AWAITING_PICKUP",
        trackingCode: null,
        trackingUploadedAt: null,
        evidenceUrl: null,
      },
      hasPendingChange: false,
    });
    assert.match(reason ?? "", /Premium/i);
  });

  it("blocks duplicate pending requests", () => {
    const reason = deliveryAddressChangeBlockedReason({
      orderStatus: "PAID",
      deliveryAddressFrozenAt: completeOrder.deliveryAddressFrozenAt,
      shipment: null,
      hasPendingChange: true,
    });
    assert.match(reason ?? "", /pendiente/i);
  });
});
