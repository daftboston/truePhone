import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  acceptanceGuard,
  earliestPickupDay,
  mayReadQuote,
  mayReview,
  MAX_COP,
  offerExpiry,
  priceRange,
  reviewDeadline,
  reviewOpening,
} from "./policy";
import {
  draftSchema,
  acceptSchema,
  offerSchema,
} from "@/features/buyback/schemas";
import { parsePriceRows } from "./price-rows";
import { detectImage } from "./photos";
const d = (s: string) => new Date(s + "-05:00");
describe("buyback Bogotá policy", () => {
  it("uses the purchase price once, without a second discount", () =>
    assert.deepEqual(priceRange(705000), { minCop: 605000, maxCop: 755000 }));
  for (const price of [-1, 0, 100000, 100000.5, Infinity, MAX_COP + 1])
    it(`rejects invalid price ${price}`, () =>
      assert.throws(() => priceRange(price)));
  for (const [start, end] of [
    ["2026-11-06T16:00:00", "2026-11-06T18:00:00"],
    ["2026-11-06T17:00:00", "2026-11-09T10:00:00"],
    ["2026-11-06T17:30:00", "2026-11-09T10:30:00"],
    ["2026-11-06T18:00:00", "2026-11-09T11:00:00"],
    ["2026-11-07T11:00:00", "2026-11-09T11:00:00"],
    ["2026-11-09T08:00:00", "2026-11-09T11:00:00"],
  ])
    it(`adds working hours from ${start}`, () =>
      assert.equal(reviewDeadline(d(start)).getTime(), d(end).getTime()));
  it("reports the next review opening without browser scheduling logic", () => {
    assert.equal(
      reviewOpening(d("2026-11-07T11:00:00")).getTime(),
      d("2026-11-09T09:00:00").getTime(),
    );
  });
  it("expires at next business day's 18:00 Bogotá", () =>
    assert.equal(
      offerExpiry(d("2026-11-06T12:00:00")).getTime(),
      d("2026-11-09T18:00:00").getTime(),
    ));
  it("handles pickup cutoff strictly and skips weekends", () => {
    assert.equal(earliestPickupDay(d("2026-11-06T14:59:59")), "2026-11-06");
    assert.equal(earliestPickupDay(d("2026-11-06T15:00:00")), "2026-11-09");
    assert.equal(earliestPickupDay(d("2026-11-08T10:00:00")), "2026-11-09");
  });
  it("allows only owner or DB-backed review roles", () => {
    assert.equal(
      mayReadQuote({ id: "other", role: "SELLER" }, "seller"),
      false,
    );
    assert.equal(mayReadQuote({ id: "seller", role: "BUYER" }, "seller"), true);
    assert.equal(
      mayReadQuote({ id: "other", role: "REVIEWER" }, "seller"),
      true,
    );
    assert.equal(mayReview("ADMIN"), true);
    assert.equal(mayReview("SELLER"), false);
  });
});
describe("exact offer acceptance", () => {
  const input = {
    status: "OFFER_SENT",
    currentOfferVersion: 2,
    offeredVersion: 2,
    expectedOfferVersion: 2,
    expiresAt: d("2026-11-09T18:00:00"),
    acceptedAt: null,
    supersededAt: null,
    now: d("2026-11-09T17:59:59"),
  };
  it("accepts only the current exact version", () =>
    assert.equal(acceptanceGuard(input), "OK"));
  it("rejects stale acceptance", () =>
    assert.equal(
      acceptanceGuard({ ...input, expectedOfferVersion: 1 }),
      "OFFER_CHANGED",
    ));
  it("rejects superseded evidence", () =>
    assert.equal(
      acceptanceGuard({ ...input, supersededAt: input.now }),
      "OFFER_CHANGED",
    ));
  it("rejects at the exact expiry instant", () =>
    assert.equal(
      acceptanceGuard({ ...input, now: input.expiresAt }),
      "OFFER_EXPIRED",
    ));
  it("duplicate clicks remain idempotent after expiry", () =>
    assert.equal(
      acceptanceGuard({
        ...input,
        status: "OFFER_ACCEPTED",
        acceptedAt: input.now,
        now: d("2026-11-10T12:00:00"),
      }),
      "ALREADY_ACCEPTED",
    ));
  it("never reopens purchased/cancelled cases", () => {
    for (const status of ["PURCHASED", "CANCELLED"])
      assert.equal(
        acceptanceGuard({ ...input, status, acceptedAt: input.now }),
        "INVALID_STATE",
      );
  });
});
const catalog = [
  {
    iphoneModelId: "m11",
    iphoneStorageId: "s128",
    modelName: "iPhone 11",
    valueGb: 128,
  },
  {
    iphoneModelId: "m12",
    iphoneStorageId: "s128",
    modelName: "iPhone 12",
    valueGb: 128,
  },
];
const header = ["Modelo", "Capacidad", "Precio de compra (COP)"];
describe("bounded private sheet imports", () => {
  it("matches only catalog combinations and numeric raw COP", () => {
    const parsed = parsePriceRows(
      [header, [" iPhone 11 ", "128 GB", 705000]],
      catalog,
    );
    assert.equal(parsed.rows[0].purchasePriceCop, 705000);
    assert.deepEqual(parsed.deactivate, ["m12:s128"]);
  });
  it("rejects missing purchase column", () =>
    assert.throws(() =>
      parsePriceRows(
        [
          ["Modelo", "Capacidad", "Precio de venta (COP)"],
          ["iPhone 11", "128 GB", 705000],
        ],
        catalog,
      ),
    ));
  it("retains prior valid price on malformed price", () => {
    const p = parsePriceRows(
      [
        header,
        ["iPhone 11", "128 GB", "705.000"],
        ["iPhone 12", "128 GB", 700000],
      ],
      catalog,
    );
    assert.equal(p.issues[0].code, "INVALID_PRICE");
    assert.equal(p.deactivate.includes("m11:s128"), false);
  });
  it("rejects both duplicate rows rather than last-row-wins", () => {
    const p = parsePriceRows(
      [
        header,
        ["iPhone 11", "128 GB", 705000],
        ["iPhone 11", "128 GB", 900000],
        ["iPhone 12", "128 GB", 700000],
      ],
      catalog,
    );
    assert.equal(p.rows.length, 1);
    assert.equal(p.issues[0].code, "DUPLICATE");
    assert.equal(p.deactivate.includes("m11:s128"), false);
  });
  it("never creates unknown models", () => {
    const p = parsePriceRows(
      [header, ["Unknown", "128 GB", 705000], ["iPhone 12", "128 GB", 700000]],
      catalog,
    );
    assert.equal(p.issues[0].code, "UNKNOWN_COMBINATION");
  });
  it("leaves all prices unchanged on wholly invalid or truncated sheet", () => {
    assert.throws(() =>
      parsePriceRows([header, ["iPhone 11", "128 GB", 0]], catalog),
    );
    assert.throws(() =>
      parsePriceRows(
        Array.from({ length: 500 }, () => header),
        catalog,
      ),
    );
  });
});
describe("input/evidence guards", () => {
  it("requires explicit current-offer conditions acceptance", () =>
    assert.equal(
      acceptSchema.safeParse({
        quoteId: "q",
        offerId: "o",
        expectedOfferVersion: 1,
        conditionsAccepted: false,
      }).success,
      false,
    ));
  it("requires ownership and activation lock confirmations", () =>
    assert.equal(draftSchema.safeParse({}).success, false));
  it("rejects overflowing monetary amounts", () =>
    assert.equal(
      offerSchema.safeParse({
        quoteId: "q",
        expectedVersion: 1,
        amountCop: MAX_COP + 1,
      }).success,
      false,
    ));
  it("checks bytes instead of trusting the browser MIME", () => {
    assert.equal(
      detectImage(Buffer.from("<svg>arbitrary content</svg>")),
      null,
    );
    assert.equal(
      detectImage(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])),
      "image/png",
    );
    assert.equal(
      detectImage(Buffer.from([255, 216, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
      "image/jpeg",
    );
    assert.equal(detectImage(Buffer.from("RIFF0000WEBP")), "image/webp");
  });
});
