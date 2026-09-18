import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ACTIVE_UNLOCK_BLOCK_MESSAGE } from "@/lib/availability-hold/copy";
import {
  qualifiesForPriceDropBoost,
  BOOST_MIN_DROP_COP,
} from "@/lib/listings/boost";
import { stripBankFieldsFromLedgerRow } from "@/lib/ops-sales-ledger";
import { isMilestoneToday } from "@/lib/notifications/seller-listing-checkins";

describe("ACTIVE_UNLOCK_BLOCK_MESSAGE", () => {
  it("is Spanish copy for second buyer during unlock", () => {
    assert.match(ACTIVE_UNLOCK_BLOCK_MESSAGE, /Otro comprador/);
  });
});

describe("qualifiesForPriceDropBoost", () => {
  it("requires 3% or 50k COP drop", () => {
    assert.equal(qualifiesForPriceDropBoost(2_000_000, 1_960_000), false);
    assert.equal(qualifiesForPriceDropBoost(2_000_000, 1_940_000), true);
    assert.equal(qualifiesForPriceDropBoost(2_000_000, 1_950_000), true);
    assert.equal(
      qualifiesForPriceDropBoost(1_000_000, 1_000_000 - BOOST_MIN_DROP_COP),
      true,
    );
  });
});

describe("stripBankFieldsFromLedgerRow", () => {
  it("removes bank fields for reviewers", () => {
    const row = {
      id: "o1",
      payouts: [{ sellerBankAccount: { bankName: "Bancolombia" } }],
      sellerAmountPesos: 100,
    };
    const stripped = stripBankFieldsFromLedgerRow(row, false);
    assert.equal("payouts" in stripped, false);
    assert.equal("sellerAmountPesos" in stripped, false);
  });

  it("keeps bank fields for admins", () => {
    const row = { id: "o1", payouts: [] };
    const kept = stripBankFieldsFromLedgerRow(row, true);
    assert.deepEqual(kept, row);
  });
});

describe("isMilestoneToday", () => {
  it("matches exact Bogota calendar day", () => {
    const published = new Date("2026-09-01T12:00:00-05:00");
    const day7 = new Date("2026-09-08T15:00:00-05:00");
    assert.equal(isMilestoneToday(published, 7, day7), true);
    assert.equal(
      isMilestoneToday(published, 7, new Date("2026-09-09T12:00:00-05:00")),
      false,
    );
  });
});
