/**
 * @file tick.test.ts
 * @description Unit tests for daily cron tick batch plan.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getBogotaClock } from "@/lib/cron/bogota-clock";
import { planCronTickRuns } from "@/lib/cron/tick";

describe("planCronTickRuns daily batch", () => {
  it("maps 14:00 UTC to 09:00 Bogotá", () => {
    const now = new Date("2026-09-18T14:00:00.000Z");
    const clock = getBogotaClock(now);
    assert.equal(clock.hour, 9);
    assert.equal(clock.minute, 0);
  });

  it("runs every job on each daily tick", () => {
    const plan = planCronTickRuns(new Date("2026-09-18T14:00:00.000Z"));
    assert.equal(plan.ran.availabilityHoldExpiry, true);
    assert.equal(plan.ran.sellerListingCheckins, true);
    assert.equal(plan.ran.buyerConfirmExpiry, true);
    assert.equal(plan.ran.settlementReminders, true);
  });
});
