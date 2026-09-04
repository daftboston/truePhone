/**
 * @file ops-analytics.test.ts
 * @description Unit tests for ops analytics rate, median, and model ranking helpers.
 * @dependencies node:test, @/lib/ops-analytics
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  approvalRatePercent,
  hoursBetween,
  medianNumber,
  modelCountsFromGroups,
  viewsToCompletedPercent,
} from "@/lib/ops-analytics";

describe("medianNumber", () => {
  it("returns null for an empty sample", () => {
    assert.equal(medianNumber([]), null);
  });

  it("returns the middle value for odd lengths", () => {
    assert.equal(medianNumber([9, 1, 4]), 4);
  });

  it("averages the two middle values for even lengths", () => {
    assert.equal(medianNumber([1, 2, 3, 4]), 2.5);
  });
});

describe("approvalRatePercent", () => {
  it("returns null when nothing has been reviewed", () => {
    assert.equal(approvalRatePercent(0, 0), null);
  });

  it("rounds approved / reviewed", () => {
    assert.equal(approvalRatePercent(3, 1), 75);
  });
});

describe("viewsToCompletedPercent", () => {
  it("returns null without views so ops does not show 0% noise", () => {
    assert.equal(viewsToCompletedPercent(0, 2), null);
  });

  it("keeps one decimal of completed / views", () => {
    assert.equal(viewsToCompletedPercent(100, 3), 3);
    assert.equal(viewsToCompletedPercent(3, 1), 33.3);
  });
});

describe("hoursBetween", () => {
  it("returns elapsed hours and never goes negative", () => {
    const start = new Date("2026-09-01T00:00:00.000Z");
    const end = new Date("2026-09-01T06:00:00.000Z");
    assert.equal(hoursBetween(start, end), 6);
    assert.equal(hoursBetween(end, start), 0);
  });
});

describe("modelCountsFromGroups", () => {
  it("maps ids to names and sorts by count", () => {
    const names = new Map([
      ["a", "iPhone 13"],
      ["b", "iPhone 16"],
    ]);
    assert.deepEqual(
      modelCountsFromGroups(
        [
          { iphoneModelId: "a", _count: { _all: 2 } },
          { iphoneModelId: "b", _count: { _all: 5 } },
        ],
        names,
      ),
      [
        { name: "iPhone 16", count: 5 },
        { name: "iPhone 13", count: 2 },
      ],
    );
  });
});
