/**
 * @file settlement-guards.test.ts
 * @description Unit tests for PAID-order cancel cutoff, unpaid-cancel vs capture
 * commit filter, buyer 24h problem-report window, manual payout completion,
 * support-case unfreeze, and ops queue filter.
 * @dependencies node:test, settlement-guards, ops-payouts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buyerProblemReportBlocker,
  canCancelPaidOrder,
  manualPayoutCompletionBlocker,
  orderStatusWhereForCancelCommit,
  sellerPaidSelfCancelBlocker,
  shouldReleaseSupportCasePayoutFreeze,
  SELLER_PAID_SELF_CANCEL_BLOCKED_ERROR,
} from "@/lib/financial-core/settlement-guards";
import { authorizedManualPayoutWhere } from "@/lib/payments/ops-payouts";

const openPaid = {
  payoutCompletedAt: null,
  payoutAuthorizedAt: null,
  buyerConfirmedAt: null,
  buyerConfirmDeadlineAt: null,
};

describe("canCancelPaidOrder", () => {
  it("allows cancel before the buyer marks received", () => {
    assert.equal(canCancelPaidOrder(openPaid), true);
  });

  it("blocks cancel after the buyer marks received (24h window started)", () => {
    assert.equal(
      canCancelPaidOrder({
        ...openPaid,
        buyerConfirmDeadlineAt: new Date("2026-08-17T12:00:00.000Z"),
      }),
      false,
    );
  });

  it("blocks cancel after the buyer confirms the device", () => {
    assert.equal(
      canCancelPaidOrder({
        ...openPaid,
        buyerConfirmedAt: new Date("2026-08-17T12:00:00.000Z"),
      }),
      false,
    );
  });

  it("blocks cancel after Financial Core authorizes seller payout", () => {
    assert.equal(
      canCancelPaidOrder({
        ...openPaid,
        payoutAuthorizedAt: new Date("2026-08-17T12:00:00.000Z"),
      }),
      false,
    );
  });

  it("blocks cancel after the seller was paid", () => {
    assert.equal(
      canCancelPaidOrder({
        ...openPaid,
        payoutCompletedAt: new Date("2026-08-17T12:00:00.000Z"),
      }),
      false,
    );
  });
});

describe("orderStatusWhereForCancelCommit", () => {
  it("does not let unpaid cancel match a PAID order", () => {
    assert.deepEqual(orderStatusWhereForCancelCommit("pre_payment"), {
      status: "AWAITING_PAYMENT",
    });
  });
});

describe("sellerPaidSelfCancelBlocker", () => {
  const sellerId = "seller-1";
  const buyerId = "buyer-1";

  it("blocks seller self-cancel on PAID orders", () => {
    assert.equal(
      sellerPaidSelfCancelBlocker({
        orderStatus: "PAID",
        actorId: sellerId,
        sellerId,
      }),
      SELLER_PAID_SELF_CANCEL_BLOCKED_ERROR,
    );
  });

  it("allows seller cancel on unpaid (AWAITING_PAYMENT) orders", () => {
    assert.equal(
      sellerPaidSelfCancelBlocker({
        orderStatus: "AWAITING_PAYMENT",
        actorId: sellerId,
        sellerId,
      }),
      null,
    );
  });

  it("allows buyer cancel on PAID orders", () => {
    assert.equal(
      sellerPaidSelfCancelBlocker({
        orderStatus: "PAID",
        actorId: buyerId,
        sellerId,
      }),
      null,
    );
  });

  it("allows ops seller-abandon cancel on PAID orders", () => {
    assert.equal(
      sellerPaidSelfCancelBlocker({
        orderStatus: "PAID",
        actorId: "ops-reviewer",
        sellerId,
        asOpsSellerAbandon: true,
      }),
      null,
    );
  });
});

describe("manualPayoutCompletionBlocker", () => {
  it("allows completing an unfrozen PAID order", () => {
    assert.equal(
      manualPayoutCompletionBlocker({
        status: "PAID",
        payoutFrozen: false,
        payoutCompletedAt: null,
      }),
      null,
    );
  });

  it("blocks completing a cancelled order (buyer refund already issued)", () => {
    const error = manualPayoutCompletionBlocker({
      status: "CANCELLED",
      payoutFrozen: false,
      payoutCompletedAt: null,
    });
    assert.match(error ?? "", /custodia/);
  });

  it("blocks completing a frozen dispute order", () => {
    const error = manualPayoutCompletionBlocker({
      status: "PAID",
      payoutFrozen: true,
      payoutCompletedAt: null,
    });
    assert.match(error ?? "", /congelado/);
  });

  it("is a no-op when payout already completed", () => {
    assert.equal(
      manualPayoutCompletionBlocker({
        status: "COMPLETED",
        payoutFrozen: false,
        payoutCompletedAt: new Date("2026-08-17T12:00:00.000Z"),
      }),
      null,
    );
  });
});

describe("shouldReleaseSupportCasePayoutFreeze", () => {
  const ownedOnly = {
    payoutFrozen: true,
    freezeRecordedForThisCase: true,
    hasChargebackReceived: false,
    hasOtherDisputeOpened: false,
  };

  it("releases when this case is the only freeze source", () => {
    assert.equal(shouldReleaseSupportCasePayoutFreeze(ownedOnly), true);
  });

  it("keeps the freeze when a chargeback was recorded", () => {
    assert.equal(
      shouldReleaseSupportCasePayoutFreeze({
        ...ownedOnly,
        hasChargebackReceived: true,
      }),
      false,
    );
  });

  it("keeps the freeze when a buyer problem or other dispute is open", () => {
    assert.equal(
      shouldReleaseSupportCasePayoutFreeze({
        ...ownedOnly,
        hasOtherDisputeOpened: true,
      }),
      false,
    );
  });

  it("does not unfreeze a freeze this case did not create", () => {
    assert.equal(
      shouldReleaseSupportCasePayoutFreeze({
        ...ownedOnly,
        freezeRecordedForThisCase: false,
      }),
      false,
    );
  });

  it("is a no-op when payout is already unfrozen", () => {
    assert.equal(
      shouldReleaseSupportCasePayoutFreeze({
        ...ownedOnly,
        payoutFrozen: false,
      }),
      false,
    );
  });
});

describe("buyerProblemReportBlocker", () => {
  const now = new Date("2026-09-07T12:00:00.000Z");
  const openWindow = {
    status: "PAID",
    buyerConfirmDeadlineAt: new Date("2026-09-07T18:00:00.000Z"),
    buyerConfirmedAt: null,
    payoutAuthorizedAt: null,
    payoutCompletedAt: null,
  };

  it("allows a report while the 24h window is open", () => {
    assert.equal(buyerProblemReportBlocker(openWindow, now), null);
  });

  it("blocks before the buyer marks received", () => {
    assert.match(
      buyerProblemReportBlocker(
        { ...openWindow, buyerConfirmDeadlineAt: null },
        now,
      ) ?? "",
      /recibiste/,
    );
  });

  it("blocks after the buyer confirms the device", () => {
    assert.match(
      buyerProblemReportBlocker(
        { ...openWindow, buyerConfirmedAt: now },
        now,
      ) ?? "",
      /confirmaste/,
    );
  });

  it("blocks after Financial Core authorizes seller payout", () => {
    assert.match(
      buyerProblemReportBlocker(
        { ...openWindow, payoutAuthorizedAt: now },
        now,
      ) ?? "",
      /24 horas/,
    );
  });

  it("blocks after the 24h window expires even if cron has not paid yet", () => {
    assert.match(
      buyerProblemReportBlocker(
        {
          ...openWindow,
          buyerConfirmDeadlineAt: new Date("2026-09-07T11:59:00.000Z"),
        },
        now,
      ) ?? "",
      /24 horas/,
    );
  });
});

describe("authorizedManualPayoutWhere", () => {
  it("excludes cancelled and frozen orders from the ops pay queue", () => {
    assert.equal(authorizedManualPayoutWhere.status, "AUTHORIZED");
    assert.equal(authorizedManualPayoutWhere.order.status, "PAID");
    assert.equal(authorizedManualPayoutWhere.order.payoutFrozen, false);
  });
});
