/**
 * @file seller-listing-hub.test.ts
 * @description Unit tests for seller hub query parsing and archive/relist eligibility.
 * @dependencies node:test, node:assert/strict, @/features/listings/lib/seller-listing-hub
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canArchiveListing,
  canRelistListing,
  isArchivedVistaSearch,
  listingHadPaidOrder,
  orderReachedPaid,
  parseSellerListingsSearchParams,
  sellerListingViewHref,
  statusesForVista,
} from "@/features/listings/lib/seller-listing-hub";

describe("parseSellerListingsSearchParams", () => {
  it("defaults to active listings sorted by newest created", () => {
    const query = parseSellerListingsSearchParams({});
    assert.equal(query.vista, "activos");
    assert.equal(query.q, "");
    assert.equal(query.estado, "");
    assert.equal(query.orden, "created_desc");
  });

  it("reads the archived bucket and ignores statuses outside it", () => {
    const query = parseSellerListingsSearchParams({
      vista: "archivados",
      estado: "PUBLISHED",
      q: "  iPhone  ",
      orden: "price_asc",
    });
    assert.equal(query.vista, "archivados");
    assert.equal(query.estado, "");
    assert.equal(query.q, "iPhone");
    assert.equal(query.orden, "price_asc");
  });

  it("keeps a status filter that belongs to the active bucket", () => {
    const query = parseSellerListingsSearchParams({
      estado: "REJECTED",
    });
    assert.equal(query.estado, "REJECTED");
  });

  it("falls back when sort is unknown", () => {
    const query = parseSellerListingsSearchParams({ orden: "popular" });
    assert.equal(query.orden, "created_desc");
  });
});

describe("statusesForVista", () => {
  it("keeps sold listings in the archived bucket", () => {
    assert.ok(statusesForVista("archivados").includes("SOLD"));
    assert.ok(statusesForVista("archivados").includes("ARCHIVED"));
    assert.equal(statusesForVista("activos").includes("SOLD"), false);
  });
});

describe("isArchivedVistaSearch", () => {
  it("detects vista=archivados with or without a leading question mark", () => {
    assert.equal(isArchivedVistaSearch("vista=archivados"), true);
    assert.equal(isArchivedVistaSearch("?vista=archivados&q=pro"), true);
    assert.equal(isArchivedVistaSearch("q=pro"), false);
    assert.equal(isArchivedVistaSearch(""), false);
  });
});

describe("archive and relist eligibility", () => {
  it("allows archive only for published listings", () => {
    assert.equal(canArchiveListing("PUBLISHED"), true);
    assert.equal(canArchiveListing("RESERVED"), false);
    assert.equal(canArchiveListing("DRAFT"), false);
    assert.equal(canArchiveListing("ARCHIVED"), false);
  });

  it("treats paid, completed, or held funds as a paid order", () => {
    assert.equal(orderReachedPaid({ status: "PAID", fundsHeldAt: null }), true);
    assert.equal(
      orderReachedPaid({ status: "COMPLETED", fundsHeldAt: null }),
      true,
    );
    assert.equal(
      orderReachedPaid({
        status: "CANCELLED",
        fundsHeldAt: new Date("2026-01-01"),
      }),
      true,
    );
    assert.equal(
      orderReachedPaid({ status: "CANCELLED", fundsHeldAt: null }),
      false,
    );
    assert.equal(
      orderReachedPaid({ status: "AWAITING_PAYMENT", fundsHeldAt: null }),
      false,
    );
  });

  it("blocks relist after a paid order and allows seller-only archives", () => {
    assert.equal(
      canRelistListing({ status: "ARCHIVED", hadPaidOrder: false }),
      true,
    );
    assert.equal(
      canRelistListing({ status: "ARCHIVED", hadPaidOrder: true }),
      false,
    );
    assert.equal(
      canRelistListing({ status: "SOLD", hadPaidOrder: false }),
      false,
    );
    assert.equal(
      listingHadPaidOrder([
        { status: "CANCELLED", fundsHeldAt: null },
        { status: "PAID", fundsHeldAt: new Date("2026-02-01") },
      ]),
      true,
    );
    assert.equal(
      listingHadPaidOrder([{ status: "CANCELLED", fundsHeldAt: null }]),
      false,
    );
  });
});

describe("sellerListingViewHref", () => {
  it("uses the public path for published listings and seller detail otherwise", () => {
    assert.equal(
      sellerListingViewHref({
        id: "abc",
        status: "PUBLISHED",
        slug: "iphone-15",
      }),
      "/anuncios/iphone-15",
    );
    assert.equal(
      sellerListingViewHref({
        id: "abc",
        status: "ARCHIVED",
        slug: "iphone-15",
      }),
      "/vender/abc",
    );
  });
});
