/**
 * @file messages-access.test.ts
 * @description Unit tests for listing thread message send access rules.
 * @dependencies node:test, @/lib/messages
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ListingStatus } from "@prisma/client";

import {
  blockUserSchema,
  MESSAGE_RATE_LIMIT,
  reportConversationSchema,
  sendMessageSchema,
} from "@/features/messages/schemas/message";
import {
  evaluateListingMessageSendAccess,
  listingHrefForThreadViewer,
  resolveThreadCounterpart,
  type ThreadListing,
} from "@/lib/messages";

/**
 * listing
 *
 * Test fixture builder for listing access scenarios.
 *
 * @param overrides - Partial listing fields.
 * @returns Listing-like object for evaluateListingMessageSendAccess.
 */
function listing(
  overrides: Partial<ThreadListing> &
    Pick<ThreadListing, "status" | "sellerId">,
): ThreadListing {
  return {
    id: "listing-1",
    title: "iPhone 13",
    slug: "iphone-13",
    reviewerId: null,
    deletedAt: null,
    price: 2_500_000,
    finalPrice: 2_750_000,
    images: [],
    ...overrides,
  };
}

describe("evaluateListingMessageSendAccess", () => {
  it("blocks messaging yourself", () => {
    const result = evaluateListingMessageSendAccess({
      listing: listing({ status: "PUBLISHED", sellerId: "seller" }),
      userId: "buyer",
      otherUserId: "buyer",
      hasExistingThread: false,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /ti mismo/i);
    }
  });

  it("allows buyer to contact seller on PUBLISHED", () => {
    const result = evaluateListingMessageSendAccess({
      listing: listing({ status: "PUBLISHED", sellerId: "seller" }),
      userId: "buyer",
      otherUserId: "seller",
      hasExistingThread: false,
    });
    assert.equal(result.ok, true);
  });

  it("blocks seller cold outreach on PUBLISHED without existing thread", () => {
    const result = evaluateListingMessageSendAccess({
      listing: listing({ status: "PUBLISHED", sellerId: "seller" }),
      userId: "seller",
      otherUserId: "buyer",
      hasExistingThread: false,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /respond/i);
    }
  });

  it("allows seller reply when thread already exists", () => {
    const result = evaluateListingMessageSendAccess({
      listing: listing({ status: "PUBLISHED", sellerId: "seller" }),
      userId: "seller",
      otherUserId: "buyer",
      hasExistingThread: true,
    });
    assert.equal(result.ok, true);
  });

  it("requires assigned reviewer for PENDING_REVIEW chat", () => {
    const result = evaluateListingMessageSendAccess({
      listing: listing({
        status: "PENDING_REVIEW",
        sellerId: "seller",
        reviewerId: null,
      }),
      userId: "seller",
      otherUserId: "reviewer",
      hasExistingThread: false,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /revisor asignado/i);
    }
  });

  it("allows seller ↔ assigned reviewer on PENDING_REVIEW", () => {
    const result = evaluateListingMessageSendAccess({
      listing: listing({
        status: "PENDING_REVIEW",
        sellerId: "seller",
        reviewerId: "reviewer",
      }),
      userId: "seller",
      otherUserId: "reviewer",
      hasExistingThread: false,
    });
    assert.equal(result.ok, true);
  });

  it("rejects third parties on review threads", () => {
    const result = evaluateListingMessageSendAccess({
      listing: listing({
        status: "REJECTED",
        sellerId: "seller",
        reviewerId: "reviewer",
      }),
      userId: "buyer",
      otherUserId: "seller",
      hasExistingThread: false,
    });
    assert.equal(result.ok, false);
  });

  it("rejects messaging on reserved/sold listings", () => {
    for (const status of ["RESERVED", "SOLD", "ARCHIVED"] as ListingStatus[]) {
      const result = evaluateListingMessageSendAccess({
        listing: listing({ status, sellerId: "seller" }),
        userId: "buyer",
        otherUserId: "seller",
        hasExistingThread: true,
      });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.match(result.error, /ya no acepta/i);
      }
    }
  });

  it("rejects deleted listings", () => {
    const result = evaluateListingMessageSendAccess({
      listing: listing({
        status: "PUBLISHED",
        sellerId: "seller",
        deletedAt: new Date(),
      }),
      userId: "buyer",
      otherUserId: "seller",
      hasExistingThread: false,
    });
    assert.equal(result.ok, false);
  });
});

describe("resolveThreadCounterpart", () => {
  it("maps seller to assigned reviewer on PENDING_REVIEW", () => {
    const result = resolveThreadCounterpart(
      listing({
        status: "PENDING_REVIEW",
        sellerId: "seller",
        reviewerId: "reviewer",
      }),
      "seller",
    );
    assert.deepEqual(result, { ok: true, otherUserId: "reviewer" });
  });

  it("maps buyer to seller on PUBLISHED without query", () => {
    const result = resolveThreadCounterpart(
      listing({ status: "PUBLISHED", sellerId: "seller" }),
      "buyer",
    );
    assert.deepEqual(result, { ok: true, otherUserId: "seller" });
  });

  it("requires ?con= when seller opens a published thread", () => {
    const result = resolveThreadCounterpart(
      listing({ status: "PUBLISHED", sellerId: "seller" }),
      "seller",
    );
    assert.equal(result.ok, false);
  });
});

describe("messaging schemas + rate limit", () => {
  it("rejects empty message content", () => {
    const parsed = sendMessageSchema.safeParse({
      listingId: "listing-1",
      receiverId: "buyer",
      content: "   ",
    });
    assert.equal(parsed.success, false);
  });

  it("accepts block payload", () => {
    const parsed = blockUserSchema.safeParse({ blockedId: "user-2" });
    assert.equal(parsed.success, true);
  });

  it("requires report reason length", () => {
    const short = reportConversationSchema.safeParse({
      listingId: "listing-1",
      reason: "spam",
    });
    assert.equal(short.success, false);

    const ok = reportConversationSchema.safeParse({
      listingId: "listing-1",
      reason: "El usuario pidió hablar por WhatsApp fuera de TruePhone.",
    });
    assert.equal(ok.success, true);
  });

  it("keeps a finite send rate limit for abuse protection", () => {
    assert.ok(MESSAGE_RATE_LIMIT > 0);
    assert.ok(MESSAGE_RATE_LIMIT <= 60);
  });
});

describe("listingHrefForThreadViewer", () => {
  const published = listing({ status: "PUBLISHED", sellerId: "seller" });
  const pending = listing({
    status: "PENDING_REVIEW",
    sellerId: "seller",
    reviewerId: "reviewer",
  });

  it("opens the public listing for a published anuncio", () => {
    const jump = listingHrefForThreadViewer({
      listing: published,
      viewerId: "buyer",
      viewerCanReview: false,
    });
    assert.deepEqual(jump, {
      href: "/anuncios/iphone-13",
      label: "Ver anuncio",
    });
  });

  it("sends the seller to their listing hub when it is not public", () => {
    const jump = listingHrefForThreadViewer({
      listing: pending,
      viewerId: "seller",
      viewerCanReview: false,
    });
    assert.deepEqual(jump, {
      href: "/vender/listing-1",
      label: "Ver anuncio",
    });
  });

  it("sends a reviewer to the ops listing page when it is not public", () => {
    const jump = listingHrefForThreadViewer({
      listing: pending,
      viewerId: "reviewer",
      viewerCanReview: true,
    });
    assert.deepEqual(jump, {
      href: "/revision/anuncios/listing-1",
      label: "Ver anuncio",
    });
  });

  it("still opens the public page for ops when the listing is published", () => {
    const jump = listingHrefForThreadViewer({
      listing: published,
      viewerId: "reviewer",
      viewerCanReview: true,
    });
    assert.equal(jump?.href, "/anuncios/iphone-13");
  });

  it("hides the jump for a buyer when the listing is not public", () => {
    const jump = listingHrefForThreadViewer({
      listing: pending,
      viewerId: "buyer",
      viewerCanReview: false,
    });
    assert.equal(jump, null);
  });
});
