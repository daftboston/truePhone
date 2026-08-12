/**
 * @file settlement.test.ts
 * @description Unit tests for settlement reminder eligibility and dedupe keys.
 * @dependencies node:test, settlement helpers
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CONFIRM_REMINDER_LEAD_HOURS,
  buyerConfirmReminderDedupeKey,
  buyerReceivedDedupeKey,
  isOrderEligibleForConfirmReminder,
} from "@/lib/notifications/settlement";

describe("settlement notification helpers", () => {
  it("builds stable dedupe keys per order", () => {
    assert.equal(buyerReceivedDedupeKey("ord_1"), "buyer-received:ord_1");
    assert.equal(
      buyerConfirmReminderDedupeKey("ord_1"),
      "buyer-confirm-reminder:ord_1",
    );
  });

  it("eligible when deadline is within lead window", () => {
    const now = new Date("2026-08-11T12:00:00.000Z");
    const deadline = new Date(
      now.getTime() + (CONFIRM_REMINDER_LEAD_HOURS - 1) * 60 * 60 * 1000,
    );
    assert.equal(
      isOrderEligibleForConfirmReminder(
        {
          status: "PAID",
          buyerConfirmedAt: null,
          buyerConfirmDeadlineAt: deadline,
          payoutFrozen: false,
        },
        now,
      ),
      true,
    );
  });

  it("not eligible when deadline is farther than lead window", () => {
    const now = new Date("2026-08-11T12:00:00.000Z");
    const deadline = new Date(
      now.getTime() + (CONFIRM_REMINDER_LEAD_HOURS + 2) * 60 * 60 * 1000,
    );
    assert.equal(
      isOrderEligibleForConfirmReminder(
        {
          status: "PAID",
          buyerConfirmedAt: null,
          buyerConfirmDeadlineAt: deadline,
          payoutFrozen: false,
        },
        now,
      ),
      false,
    );
  });

  it("not eligible after confirm, freeze, expiry, or wrong status", () => {
    const now = new Date("2026-08-11T12:00:00.000Z");
    const deadline = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const base = {
      status: "PAID",
      buyerConfirmedAt: null as Date | null,
      buyerConfirmDeadlineAt: deadline as Date | null,
      payoutFrozen: false,
    };

    assert.equal(
      isOrderEligibleForConfirmReminder(
        { ...base, buyerConfirmedAt: now },
        now,
      ),
      false,
    );
    assert.equal(
      isOrderEligibleForConfirmReminder({ ...base, payoutFrozen: true }, now),
      false,
    );
    assert.equal(
      isOrderEligibleForConfirmReminder({ ...base, status: "COMPLETED" }, now),
      false,
    );
    assert.equal(
      isOrderEligibleForConfirmReminder(
        {
          ...base,
          buyerConfirmDeadlineAt: new Date(now.getTime() - 1000),
        },
        now,
      ),
      false,
    );
    assert.equal(
      isOrderEligibleForConfirmReminder(
        { ...base, buyerConfirmDeadlineAt: null },
        now,
      ),
      false,
    );
  });
});
