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

  const paidGuardBase = {
    orderStatus: "PAID" as const,
    deliveryAddressFrozenAt: completeOrder.deliveryAddressFrozenAt,
    hasPendingChange: false,
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

  it("allows change before carrier tracking", () => {
    assert.equal(
      canRequestDeliveryAddressChange({
        ...paidGuardBase,
        shipment: null,
      }),
      true,
    );
    assert.equal(
      canRequestDeliveryAddressChange({
        ...paidGuardBase,
        shipment: {
          method: "CARRIER",
          status: "METHOD_SELECTED",
          trackingCode: null,
          trackingUploadedAt: null,
          evidenceUrl: null,
        },
      }),
      true,
    );
  });

  it("allows Premium method selected before handoff to TruePhone Premium", () => {
    assert.equal(
      canRequestDeliveryAddressChange({
        ...paidGuardBase,
        shipment: {
          method: "PREMIUM_BOGOTA",
          status: "AWAITING_PICKUP",
          trackingCode: null,
          trackingUploadedAt: null,
          evidenceUrl: null,
          inspection: { result: "PENDING" },
        },
      }),
      true,
    );
  });

  it("blocks change when tracking exists", () => {
    const reason = deliveryAddressChangeBlockedReason({
      ...paidGuardBase,
      shipment: {
        method: "CARRIER",
        status: "IN_TRANSIT",
        trackingCode: "ABC123",
        trackingUploadedAt: new Date(),
        evidenceUrl: null,
      },
    });
    assert.match(reason ?? "", /rastreo|guía/i);
  });

  it("blocks Premium change after inspection or transit progress", () => {
    const afterInspection = deliveryAddressChangeBlockedReason({
      ...paidGuardBase,
      shipment: {
        method: "PREMIUM_BOGOTA",
        status: "AWAITING_PICKUP",
        trackingCode: null,
        trackingUploadedAt: null,
        evidenceUrl: null,
        inspection: { result: "PASSED" },
        inspectionAt: new Date(),
      },
    });
    assert.match(afterInspection ?? "", /Premium/i);

    const inTransit = deliveryAddressChangeBlockedReason({
      ...paidGuardBase,
      shipment: {
        method: "PREMIUM_BOGOTA",
        status: "IN_TRANSIT",
        trackingCode: null,
        trackingUploadedAt: null,
        evidenceUrl: null,
        inTransitAt: new Date(),
      },
    });
    assert.match(inTransit ?? "", /avanzó/i);
  });

  it("blocks duplicate pending requests", () => {
    const reason = deliveryAddressChangeBlockedReason({
      ...paidGuardBase,
      shipment: null,
      hasPendingChange: true,
    });
    assert.match(reason ?? "", /pendiente/i);
  });
});
