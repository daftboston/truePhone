/**
 * @file seller-order-next-action.test.ts
 * @description Unit tests for the paid-seller next-action hero CTA.
 * @dependencies node:test, node:assert/strict, @/features/orders/lib/seller-order-next-action
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sellerOrderNextAction } from "@/features/orders/lib/seller-order-next-action";

describe("sellerOrderNextAction", () => {
  it("asks for a bank account before shipping", () => {
    const action = sellerOrderNextAction({
      status: "PAID",
      needsBankAccount: true,
      payoutCompletedAt: null,
      shipment: null,
    });
    assert.deepEqual(action, { href: "/pagos", label: "Agrega tu cuenta" });
  });

  it("asks to choose shipping when paid and banked", () => {
    const action = sellerOrderNextAction({
      status: "PAID",
      needsBankAccount: false,
      payoutCompletedAt: null,
      shipment: null,
    });
    assert.deepEqual(action, { href: "#envio", label: "Elige el envío" });
  });

  it("asks for carrier tracking after method select", () => {
    const action = sellerOrderNextAction({
      status: "PAID",
      needsBankAccount: false,
      payoutCompletedAt: null,
      shipment: { method: "CARRIER", trackingCode: null },
    });
    assert.deepEqual(action, {
      href: "#envio",
      label: "Sube el seguimiento",
    });
  });

  it("is silent when unpaid or already in motion", () => {
    assert.equal(
      sellerOrderNextAction({
        status: "AWAITING_PAYMENT",
        needsBankAccount: true,
        payoutCompletedAt: null,
        shipment: null,
      }),
      null,
    );
    assert.equal(
      sellerOrderNextAction({
        status: "PAID",
        needsBankAccount: false,
        payoutCompletedAt: null,
        shipment: { method: "PREMIUM_BOGOTA", trackingCode: null },
      }),
      null,
    );
  });
});
