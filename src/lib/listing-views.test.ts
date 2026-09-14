/**
 * @file listing-views.test.ts
 * @description Unit tests for listing-view skip rules, hashes, and daily keys.
 * @dependencies node:test, @/lib/listing-views
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hashListingVisitor,
  listingViewDedupeKey,
  listingViewSkipReason,
  utcDateOnly,
} from "@/lib/listing-views";

describe("listingViewSkipReason", () => {
  it("skips the listing owner", () => {
    assert.equal(
      listingViewSkipReason({
        sellerId: "seller-1",
        viewerId: "seller-1",
        userAgent: "Mozilla/5.0",
      }),
      "seller",
    );
  });

  it("skips crawler user-agents", () => {
    assert.equal(
      listingViewSkipReason({
        sellerId: "seller-1",
        viewerId: "buyer-1",
        userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)",
      }),
      "bot",
    );
    assert.equal(
      listingViewSkipReason({
        sellerId: "seller-1",
        viewerId: null,
        userAgent: "facebookexternalhit/1.1",
      }),
      "bot",
    );
  });

  it("allows guests and other signed-in buyers", () => {
    assert.equal(
      listingViewSkipReason({
        sellerId: "seller-1",
        viewerId: null,
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
      }),
      null,
    );
    assert.equal(
      listingViewSkipReason({
        sellerId: "seller-1",
        viewerId: "buyer-1",
        userAgent: "Mozilla/5.0",
      }),
      null,
    );
  });
});

describe("listingViewDedupeKey", () => {
  it("prefers the signed-in profile over the guest hash", () => {
    assert.equal(
      listingViewDedupeKey({ viewerId: "buyer-1", visitorHash: "abc" }),
      "u:buyer-1",
    );
    assert.equal(
      listingViewDedupeKey({ viewerId: null, visitorHash: "abc" }),
      "h:abc",
    );
  });
});

describe("hashListingVisitor", () => {
  it("is stable for the same IP and user-agent", () => {
    const first = hashListingVisitor("1.2.3.4", "Mozilla/5.0");
    const second = hashListingVisitor("1.2.3.4", "Mozilla/5.0");
    assert.equal(first, second);
    assert.equal(first.length, 32);
    assert.notEqual(first, hashListingVisitor("5.6.7.8", "Mozilla/5.0"));
  });
});

describe("utcDateOnly", () => {
  it("collapses times on the same UTC day", () => {
    const morning = utcDateOnly(new Date("2026-09-04T01:15:00.000Z"));
    const night = utcDateOnly(new Date("2026-09-04T23:59:59.000Z"));
    assert.equal(morning.toISOString(), "2026-09-04T00:00:00.000Z");
    assert.equal(night.toISOString(), morning.toISOString());
  });
});
