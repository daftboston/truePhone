/**
 * @file acceptance.test.ts
 * @description Unit tests for Ley 527 acceptance helpers.
 * @dependencies node:test, @/lib/legal/acceptance, @/lib/legal/constants
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  currentLegalVersionIds,
  isLegalAcceptedValue,
} from "@/lib/legal/acceptance";
import { LEGAL_LAST_UPDATED_ISO } from "@/lib/legal/constants";

describe("legal acceptance helpers", () => {
  it("uses the current legal last-updated stamp as version id", () => {
    const versions = currentLegalVersionIds();
    assert.equal(versions.termsVersionId, LEGAL_LAST_UPDATED_ISO);
    assert.equal(versions.privacyVersionId, LEGAL_LAST_UPDATED_ISO);
  });

  it("parses checkbox values from FormData", () => {
    const accepted = new FormData();
    accepted.set("legalAccepted", "true");
    const rejected = new FormData();

    assert.equal(isLegalAcceptedValue(accepted), true);
    assert.equal(isLegalAcceptedValue(rejected), false);
    assert.equal(isLegalAcceptedValue(true), true);
    assert.equal(isLegalAcceptedValue(false), false);
  });
});
