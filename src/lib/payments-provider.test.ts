/**
 * @file payments-provider.test.ts
 * @description Unit tests for payment provider resolution and Wompi helpers.
 * @dependencies node:test, @/lib/payments/*
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  pesosToWompiCents,
  verifyWompiEventChecksum,
  wompiCentsToPesos,
} from "@/lib/payments/provider";

describe("payment amount conversion", () => {
  it("converts COP pesos to Wompi cents", () => {
    assert.equal(pesosToWompiCents(2_000_000), 200_000_000);
    assert.equal(wompiCentsToPesos(200_000_000), 2_000_000);
  });
});

describe("verifyWompiEventChecksum", () => {
  it("accepts a valid checksum for concatenated properties + timestamp + secret", () => {
    const eventsSecret = "prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z";
    const data = {
      transaction: {
        id: "1234-1610641025-49201",
        status: "APPROVED",
        amount_in_cents: 4490000,
      },
    };
    const properties = [
      "transaction.id",
      "transaction.status",
      "transaction.amount_in_cents",
    ];
    const timestamp = 1530291411;
    const checksum =
      "5a18ec5e8fdb7df463e9f94774cba8f583ba21bd04a09ceff2ea68a4bc0aefbe";

    assert.equal(
      verifyWompiEventChecksum({
        data,
        properties,
        timestamp,
        checksum,
        eventsSecret,
      }),
      true,
    );
  });

  it("rejects a tampered checksum", () => {
    assert.equal(
      verifyWompiEventChecksum({
        data: {
          transaction: {
            id: "1234-1610641025-49201",
            status: "APPROVED",
            amount_in_cents: 4490000,
          },
        },
        properties: [
          "transaction.id",
          "transaction.status",
          "transaction.amount_in_cents",
        ],
        timestamp: 1530291411,
        checksum: "deadbeef",
        eventsSecret: "prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z",
      }),
      false,
    );
  });
});
