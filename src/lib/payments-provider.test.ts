/**
 * @file payments-provider.test.ts
 * @description Unit tests for payment provider resolution and Wompi helpers.
 * @dependencies node:test, @/lib/payments/*, @/lib/payments/payouts/resolve-provider
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isMockPaymentsEnabled,
  resolvePaymentProvider,
} from "@/lib/payments/resolve-provider";
import { resolvePayoutProvider } from "@/lib/payments/payouts/resolve-provider";
import {
  pesosToWompiCents,
  verifyWompiEventChecksum,
  wompiCentsToPesos,
} from "@/lib/payments/provider";

const ENV_KEYS = [
  "VERCEL_ENV",
  "PAYMENTS_PROVIDER",
  "PAYOUTS_PROVIDER",
  "WOMPI_PUBLIC_KEY",
  "WOMPI_PRIVATE_KEY",
  "WOMPI_EVENTS_SECRET",
] as const;

/**
 * withEnv
 *
 * Temporarily overrides process.env keys and restores them after the callback.
 *
 * @param overrides - Env values; `undefined` deletes the key.
 * @param run - Test body.
 */
function withEnv(
  overrides: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>,
  run: () => void,
) {
  const previous = new Map<string, string | undefined>();
  for (const key of ENV_KEYS) {
    previous.set(key, process.env[key]);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

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

describe("resolvePaymentProvider production guards", () => {
  it("falls back to mock locally when Wompi is unset", () => {
    withEnv(
      {
        VERCEL_ENV: undefined,
        PAYMENTS_PROVIDER: undefined,
        WOMPI_PUBLIC_KEY: undefined,
        WOMPI_PRIVATE_KEY: undefined,
        WOMPI_EVENTS_SECRET: undefined,
      },
      () => {
        const resolved = resolvePaymentProvider("http://localhost:3000");
        assert.equal(resolved.mode, "MOCK");
        assert.equal(isMockPaymentsEnabled(), true);
      },
    );
  });

  it("refuses mock payments in Vercel production", () => {
    withEnv(
      {
        VERCEL_ENV: "production",
        PAYMENTS_PROVIDER: "mock",
        WOMPI_PUBLIC_KEY: undefined,
        WOMPI_PRIVATE_KEY: undefined,
        WOMPI_EVENTS_SECRET: undefined,
      },
      () => {
        assert.throws(
          () => resolvePaymentProvider("https://truephone.co"),
          /not allowed in production/,
        );
        assert.equal(isMockPaymentsEnabled(), false);
      },
    );
  });

  it("refuses a silent mock fallback in Vercel production", () => {
    withEnv(
      {
        VERCEL_ENV: "production",
        PAYMENTS_PROVIDER: undefined,
        WOMPI_PUBLIC_KEY: undefined,
        WOMPI_PRIVATE_KEY: undefined,
        WOMPI_EVENTS_SECRET: undefined,
      },
      () => {
        assert.throws(
          () => resolvePaymentProvider("https://truephone.co"),
          /Mock payments are disabled/,
        );
      },
    );
  });
});

describe("resolvePayoutProvider production guards", () => {
  it("defaults to manual locally", () => {
    withEnv({ VERCEL_ENV: undefined, PAYOUTS_PROVIDER: undefined }, () => {
      assert.equal(resolvePayoutProvider().mode, "MANUAL");
    });
  });

  it("refuses mock payouts in Vercel production", () => {
    withEnv({ VERCEL_ENV: "production", PAYOUTS_PROVIDER: "mock" }, () => {
      assert.throws(
        () => resolvePayoutProvider(),
        /PAYOUTS_PROVIDER=mock is not allowed in production/,
      );
    });
  });
});
