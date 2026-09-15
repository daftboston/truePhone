/**
 * @file compare-models-shell.test.ts
 * @description Tests shareable compare URL helpers.
 * @dependencies node:test, node:assert/strict, compare-models-shell
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCompareHref } from "@/features/listings/components/compare-models-shell";

describe("buildCompareHref", () => {
  it("builds a shareable compare URL from two slugs", () => {
    assert.equal(
      buildCompareHref("/comparar", "iphone-15", "iphone-15-pro"),
      "/comparar?a=iphone-15&b=iphone-15-pro",
    );
  });

  it("omits query params when no models are selected", () => {
    assert.equal(buildCompareHref("/comparar", "", ""), "/comparar");
  });

  it("keeps a single selected model in the query string", () => {
    assert.equal(
      buildCompareHref("/comparar", "iphone-16", ""),
      "/comparar?a=iphone-16",
    );
  });
});
