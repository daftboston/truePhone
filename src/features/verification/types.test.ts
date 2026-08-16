/**
 * @file types.test.ts
 * @description Unit tests for verification nav destinations.
 * @dependencies node:test, node:assert/strict, @/features/verification/types
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { verificationNavHref } from "@/features/verification/types";

describe("verificationNavHref", () => {
  it("never sends verified users to /vender", () => {
    assert.equal(
      verificationNavHref({ verifikStatus: "verified" }),
      "/verificacion",
    );
  });

  it("sends pending review to the submitted confirmation", () => {
    assert.equal(
      verificationNavHref({ verifikStatus: "pending" }),
      "/verificacion/enviada",
    );
  });

  it("starts unverified users at the privacy step", () => {
    assert.equal(
      verificationNavHref({ verifikStatus: "unverified" }),
      "/verificacion",
    );
  });
});
