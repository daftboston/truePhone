/**
 * @file identity-file.test.ts
 * @description Unit tests for keep-existing identity upload and cédula number helpers.
 * @dependencies node:test, node:assert/strict, @/features/verification/schemas/identity
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolveCedulaNumberInput,
  resolveOptionalIdentityFile,
} from "@/features/verification/schemas/identity";

describe("resolveOptionalIdentityFile", () => {
  it("keeps an existing path when no file is sent", () => {
    const result = resolveOptionalIdentityFile(
      null,
      "identity-docs/user/front.jpg",
      "Sube la foto.",
    );
    assert.deepEqual(result, { ok: true, file: null });
  });

  it("errors when nothing is stored and no file is sent", () => {
    const result = resolveOptionalIdentityFile(null, null, "Sube la foto.");
    assert.deepEqual(result, { ok: false, error: "Sube la foto." });
  });

  it("uses a new file when present", () => {
    const file = new File(["abc"], "front.jpg", { type: "image/jpeg" });
    const result = resolveOptionalIdentityFile(
      file,
      "identity-docs/user/front.jpg",
      "Sube la foto.",
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.file, file);
    }
  });
});

describe("resolveCedulaNumberInput", () => {
  it("allows empty input when a hash already exists", () => {
    assert.deepEqual(resolveCedulaNumberInput("", true), {
      ok: true,
      documentNumber: null,
    });
  });

  it("requires digits on the first visit", () => {
    const result = resolveCedulaNumberInput("", false);
    assert.equal(result.ok, false);
  });

  it("accepts a valid number", () => {
    assert.deepEqual(resolveCedulaNumberInput("1234567890", false), {
      ok: true,
      documentNumber: "1234567890",
    });
  });
});
