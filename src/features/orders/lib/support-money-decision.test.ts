/**
 * @file support-money-decision.test.ts
 * @description Unit tests for order-support money-decision detection.
 * @dependencies node:test, node:assert/strict, ./support-money-decision
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isSupportMoneyDecision,
  supportMoneyDecisionHint,
} from "./support-money-decision";

describe("isSupportMoneyDecision", () => {
  it("flags paid cancel and fulfillment unfreeze paths", () => {
    assert.equal(
      isSupportMoneyDecision("APPROVE_CANCELLATION", "SELLER_CANCELLATION"),
      true,
    );
    assert.equal(
      isSupportMoneyDecision("CONTINUE_FULFILLMENT", "FULFILLMENT_EXCEPTION"),
      true,
    );
    assert.equal(
      isSupportMoneyDecision("REJECT", "FULFILLMENT_EXCEPTION"),
      true,
    );
  });

  it("leaves notes and non-money rejects alone", () => {
    assert.equal(
      isSupportMoneyDecision("REJECT", "SELLER_CANCELLATION"),
      false,
    );
    assert.equal(isSupportMoneyDecision("RESOLVE", "GENERAL_SUPPORT"), false);
    assert.equal(
      isSupportMoneyDecision("ESCALATE", "SELLER_CANCELLATION"),
      false,
    );
  });
});

describe("supportMoneyDecisionHint", () => {
  it("explains the buyer remedy on accepted cancel", () => {
    assert.match(supportMoneyDecisionHint("APPROVE_CANCELLATION") ?? "", /8%/);
  });
});
