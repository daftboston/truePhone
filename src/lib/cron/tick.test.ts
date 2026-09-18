/**
 * @file tick.test.ts
 * @description Unit tests for hourly cron tick Bogotá scheduling.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getBogotaClock, isBogotaHourSlot } from "@/lib/cron/bogota-clock";
import { planCronTickRuns } from "@/lib/cron/tick";

describe("cron tick Bogotá slots", () => {
  it("maps 19:00 UTC to 14:00 Bogotá", () => {
    const now = new Date("2026-09-18T19:00:00.000Z");
    const clock = getBogotaClock(now);
    assert.equal(clock.hour, 14);
    assert.equal(clock.minute, 0);
    assert.equal(isBogotaHourSlot(now, 14), true);
  });

  it("maps 21:00 UTC to 16:00 Bogotá", () => {
    const now = new Date("2026-09-18T21:00:00.000Z");
    assert.equal(isBogotaHourSlot(now, 16), true);
    assert.equal(isBogotaHourSlot(now, 17), false);
  });

  it("maps 22:00 UTC to 17:00 Bogotá (settlement slot)", () => {
    const now = new Date("2026-09-18T22:00:00.000Z");
    assert.equal(isBogotaHourSlot(now, 17), true);
  });
});

describe("planCronTickRuns", () => {
  it("always schedules availability hold expiry", () => {
    const plan = planCronTickRuns(new Date("2026-09-18T12:00:00.000Z"));
    assert.equal(plan.ran.availabilityHoldExpiry, true);
  });

  it("schedules seller check-ins at 14:00 Bogotá only", () => {
    const at14 = planCronTickRuns(new Date("2026-09-18T19:00:00.000Z"));
    assert.equal(at14.ran.sellerListingCheckins, true);

    const at15 = planCronTickRuns(new Date("2026-09-18T20:00:00.000Z"));
    assert.equal(at15.ran.sellerListingCheckins, false);
  });

  it("schedules buyer confirm at 16:00 and settlement at 17:00 Bogotá", () => {
    const at16 = planCronTickRuns(new Date("2026-09-18T21:00:00.000Z"));
    assert.equal(at16.ran.buyerConfirmExpiry, true);
    assert.equal(at16.ran.settlementReminders, false);

    const at17 = planCronTickRuns(new Date("2026-09-18T22:00:00.000Z"));
    assert.equal(at17.ran.settlementReminders, true);
    assert.equal(at17.ran.buyerConfirmExpiry, false);
  });
});
