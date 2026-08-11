/**
 * @file order-timeline.test.ts
 * @description Unit tests for buildOrderTimeline settlement stages.
 * @dependencies node:test, node:assert/strict, @/lib/orders
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildOrderTimeline } from "@/lib/orders";

const base = {
  createdAt: new Date("2026-08-01T10:00:00.000Z"),
  cancelledAt: null as Date | null,
  completedAt: null as Date | null,
  paidAt: new Date("2026-08-01T11:00:00.000Z"),
  fundsHeldAt: new Date("2026-08-01T11:00:00.000Z"),
  payoutCompletedAt: null as Date | null,
  buyerConfirmedAt: null as Date | null,
  buyerConfirmDeadlineAt: null as Date | null,
  shipment: null as {
    methodSelectedAt: Date;
    trackingUploadedAt: Date | null;
    deliveredAt: Date | null;
    method: string;
  } | null,
};

describe("buildOrderTimeline", () => {
  it("shows hold → shipping pending after payment", () => {
    const events = buildOrderTimeline({
      ...base,
      status: "PAID",
    });
    const ids = events.map((e) => e.id);
    assert.deepEqual(ids, [
      "created",
      "payment",
      "shipping-pending",
      "confirm",
      "payout",
      "completed",
    ]);
    assert.equal(events.find((e) => e.id === "payment")?.done, true);
    assert.equal(events.find((e) => e.id === "shipping-pending")?.done, false);
  });

  it("marks confirm done after 24h expiry without buyer confirm", () => {
    const deadline = new Date("2026-08-03T12:00:00.000Z");
    const now = new Date("2026-08-03T13:00:00.000Z");
    const events = buildOrderTimeline(
      {
        ...base,
        status: "PAID",
        buyerConfirmDeadlineAt: deadline,
        shipment: {
          methodSelectedAt: new Date("2026-08-01T12:00:00.000Z"),
          trackingUploadedAt: new Date("2026-08-02T09:00:00.000Z"),
          deliveredAt: new Date("2026-08-02T12:00:00.000Z"),
          method: "CARRIER",
        },
      },
      now,
    );
    const confirm = events.find((e) => e.id === "confirm");
    assert.equal(confirm?.done, true);
    assert.match(confirm?.label ?? "", /24h/);
  });

  it("splits payout and completed after settlement", () => {
    const completedAt = new Date("2026-08-04T10:00:00.000Z");
    const events = buildOrderTimeline({
      ...base,
      status: "COMPLETED",
      buyerConfirmedAt: new Date("2026-08-03T15:00:00.000Z"),
      buyerConfirmDeadlineAt: new Date("2026-08-04T12:00:00.000Z"),
      payoutCompletedAt: completedAt,
      completedAt,
      shipment: {
        methodSelectedAt: new Date("2026-08-01T12:00:00.000Z"),
        trackingUploadedAt: new Date("2026-08-02T09:00:00.000Z"),
        deliveredAt: new Date("2026-08-02T12:00:00.000Z"),
        method: "CARRIER",
      },
    });
    const ids = events.map((e) => e.id);
    assert.ok(ids.includes("payout"));
    assert.ok(ids.includes("completed"));
    assert.ok(ids.includes("reviews"));
    assert.equal(
      events.find((e) => e.id === "confirm")?.label,
      "Comprador confirmó el dispositivo",
    );
    assert.equal(events.find((e) => e.id === "payout")?.done, true);
    assert.equal(events.find((e) => e.id === "completed")?.done, true);
  });
});
