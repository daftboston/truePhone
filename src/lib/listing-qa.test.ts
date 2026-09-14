/**
 * @file listing-qa.test.ts
 * @description Unit tests for public listing Q&A access, fishing, and hide visibility.
 * @dependencies node:test, @/lib/listing-qa-access
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ListingStatus } from "@prisma/client";

import {
  askListingQuestionSchema,
  reportListingQuestionSchema,
} from "@/features/listing-qa/schemas/listing-qa";
import {
  canAnswerListingQuestion,
  canAskListingQuestion,
  canDeleteOwnQuestion,
  canViewHiddenQaItem,
  containsOffPlatformContact,
  listingQaPublicHref,
  type ListingQaListing,
} from "@/lib/listing-qa-access";

/**
 * listing
 *
 * Test fixture builder for Q&A listing access scenarios.
 *
 * @param overrides - Partial listing fields.
 * @returns ListingQaListing.
 */
function listing(
  overrides: Partial<ListingQaListing> &
    Pick<ListingQaListing, "status" | "sellerId">,
): ListingQaListing {
  return {
    id: "listing-1",
    slug: "iphone-13",
    deletedAt: null,
    ...overrides,
  };
}

describe("canAskListingQuestion", () => {
  it("allows a buyer to ask on PUBLISHED", () => {
    const result = canAskListingQuestion({
      listing: listing({ status: "PUBLISHED", sellerId: "seller" }),
      actorId: "buyer",
    });
    assert.equal(result.ok, true);
  });

  it("blocks the seller from asking on their listing", () => {
    const result = canAskListingQuestion({
      listing: listing({ status: "PUBLISHED", sellerId: "seller" }),
      actorId: "seller",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /propio anuncio/i);
    }
  });

  it("blocks asks when the listing is not PUBLISHED", () => {
    const statuses: ListingStatus[] = ["RESERVED", "SOLD", "ARCHIVED"];
    for (const status of statuses) {
      const result = canAskListingQuestion({
        listing: listing({ status, sellerId: "seller" }),
        actorId: "buyer",
      });
      assert.equal(result.ok, false);
    }
  });

  it("blocks asks on deleted listings", () => {
    const result = canAskListingQuestion({
      listing: listing({
        status: "PUBLISHED",
        sellerId: "seller",
        deletedAt: new Date(),
      }),
      actorId: "buyer",
    });
    assert.equal(result.ok, false);
  });
});

describe("canAnswerListingQuestion", () => {
  it("allows the seller to answer on PUBLISHED", () => {
    const result = canAnswerListingQuestion({
      listing: listing({ status: "PUBLISHED", sellerId: "seller" }),
      actorId: "seller",
      hasAnswer: false,
      create: true,
    });
    assert.equal(result.ok, true);
  });

  it("allows the seller to answer on RESERVED", () => {
    const result = canAnswerListingQuestion({
      listing: listing({ status: "RESERVED", sellerId: "seller" }),
      actorId: "seller",
      hasAnswer: false,
      create: true,
    });
    assert.equal(result.ok, true);
  });

  it("blocks a buyer from answering", () => {
    const result = canAnswerListingQuestion({
      listing: listing({ status: "PUBLISHED", sellerId: "seller" }),
      actorId: "buyer",
      hasAnswer: false,
      create: true,
    });
    assert.equal(result.ok, false);
  });

  it("blocks a second official answer", () => {
    const result = canAnswerListingQuestion({
      listing: listing({ status: "PUBLISHED", sellerId: "seller" }),
      actorId: "seller",
      hasAnswer: true,
      create: true,
    });
    assert.equal(result.ok, false);
  });

  it("blocks new answers after SOLD", () => {
    const result = canAnswerListingQuestion({
      listing: listing({ status: "SOLD", sellerId: "seller" }),
      actorId: "seller",
      hasAnswer: false,
      create: true,
    });
    assert.equal(result.ok, false);
  });
});

describe("canDeleteOwnQuestion", () => {
  it("allows the asker to delete an unanswered question", () => {
    const result = canDeleteOwnQuestion({
      actorId: "buyer",
      askerId: "buyer",
      hasAnswer: false,
      hiddenAt: null,
    });
    assert.equal(result.ok, true);
  });

  it("blocks delete after an official answer", () => {
    const result = canDeleteOwnQuestion({
      actorId: "buyer",
      askerId: "buyer",
      hasAnswer: true,
      hiddenAt: null,
    });
    assert.equal(result.ok, false);
  });

  it("blocks another user from deleting", () => {
    const result = canDeleteOwnQuestion({
      actorId: "other",
      askerId: "buyer",
      hasAnswer: false,
      hiddenAt: null,
    });
    assert.equal(result.ok, false);
  });
});

describe("canViewHiddenQaItem", () => {
  it("hides hidden rows from guests", () => {
    assert.equal(
      canViewHiddenQaItem({
        hiddenAt: new Date(),
        authorId: "buyer",
        sellerId: "seller",
        viewer: { profileId: null, isStaff: false },
      }),
      false,
    );
  });

  it("shows hidden rows to the author, seller, and staff", () => {
    const hiddenAt = new Date();
    assert.equal(
      canViewHiddenQaItem({
        hiddenAt,
        authorId: "buyer",
        sellerId: "seller",
        viewer: { profileId: "buyer", isStaff: false },
      }),
      true,
    );
    assert.equal(
      canViewHiddenQaItem({
        hiddenAt,
        authorId: "buyer",
        sellerId: "seller",
        viewer: { profileId: "seller", isStaff: false },
      }),
      true,
    );
    assert.equal(
      canViewHiddenQaItem({
        hiddenAt,
        authorId: "buyer",
        sellerId: "seller",
        viewer: { profileId: "reviewer", isStaff: true },
      }),
      true,
    );
  });

  it("keeps visible rows public", () => {
    assert.equal(
      canViewHiddenQaItem({
        hiddenAt: null,
        authorId: "buyer",
        sellerId: "seller",
        viewer: { profileId: null, isStaff: false },
      }),
      true,
    );
  });
});

describe("containsOffPlatformContact", () => {
  it("rejects Colombian mobiles and WhatsApp copy", () => {
    assert.equal(containsOffPlatformContact("Escríbeme al 3001234567"), true);
    assert.equal(containsOffPlatformContact("WhatsApp +57 310 555 6677"), true);
    assert.equal(containsOffPlatformContact("t.me/vendedor"), true);
  });

  it("allows device questions without contact fishing", () => {
    assert.equal(
      containsOffPlatformContact("¿La batería está al 89% real?"),
      false,
    );
    assert.equal(
      containsOffPlatformContact("¿Incluye caja y cargador del 13?"),
      false,
    );
  });
});

describe("listingQa schemas", () => {
  it("requires a question body", () => {
    const parsed = askListingQuestionSchema.safeParse({
      listingId: "listing-1",
      body: "   ",
    });
    assert.equal(parsed.success, false);
  });

  it("requires exactly one report target", () => {
    const both = reportListingQuestionSchema.safeParse({
      questionId: "q1",
      answerId: "a1",
      reason: "Contiene un teléfono y pide WhatsApp.",
    });
    assert.equal(both.success, false);

    const one = reportListingQuestionSchema.safeParse({
      questionId: "q1",
      reason: "Contiene un teléfono y pide WhatsApp.",
    });
    assert.equal(one.success, true);
  });
});

describe("listingQaPublicHref", () => {
  it("anchors to the preguntas section", () => {
    assert.equal(
      listingQaPublicHref("iphone-13"),
      "/anuncios/iphone-13#preguntas",
    );
  });
});
