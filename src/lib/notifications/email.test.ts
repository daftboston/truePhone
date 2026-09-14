/**
 * @file email.test.ts
 * @description Unit tests for Resend delivery vs production fail-closed noop.
 * @dependencies node:test, email
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sendNotificationEmail } from "@/lib/notifications/email";

/**
 * withEmailEnv
 *
 * Temporarily overrides Vercel and Resend env for delivery tests.
 *
 * @param overrides - Env values; `undefined` deletes the key.
 * @param run - Async test body.
 */
async function withEmailEnv(
  overrides: {
    VERCEL_ENV?: string;
    RESEND_API_KEY?: string;
  },
  run: () => Promise<void>,
) {
  const previous = {
    VERCEL_ENV: process.env.VERCEL_ENV,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  };
  if (overrides.VERCEL_ENV === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = overrides.VERCEL_ENV;
  if (overrides.RESEND_API_KEY === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = overrides.RESEND_API_KEY;
  }
  try {
    await run();
  } finally {
    if (previous.VERCEL_ENV === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous.VERCEL_ENV;
    if (previous.RESEND_API_KEY === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previous.RESEND_API_KEY;
    }
  }
}

describe("sendNotificationEmail", () => {
  it("noops locally when Resend is unset", async () => {
    await withEmailEnv(
      { VERCEL_ENV: undefined, RESEND_API_KEY: undefined },
      async () => {
        const result = await sendNotificationEmail({
          to: "buyer@example.com",
          subject: "TruePhone: prueba",
          text: "Cuerpo",
        });
        assert.deepEqual(result, { ok: true, mode: "noop" });
      },
    );
  });

  it("refuses noop email in Vercel production", async () => {
    await withEmailEnv(
      { VERCEL_ENV: "production", RESEND_API_KEY: undefined },
      async () => {
        const result = await sendNotificationEmail({
          to: "buyer@example.com",
          subject: "TruePhone: prueba",
          text: "Cuerpo",
        });
        assert.equal(result.ok, false);
        if (!result.ok) {
          assert.match(
            result.error,
            /RESEND_API_KEY is required in production/,
          );
        }
      },
    );
  });
});
