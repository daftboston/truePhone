/**
 * @file filter-faq.test.ts
 * @description Unit tests for public FAQ search matching.
 * @dependencies node:test, node:assert/strict, @/lib/help/filter-faq
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { FaqCluster } from "@/lib/help/faq";
import { filterFaqClusters } from "@/lib/help/filter-faq";

const SAMPLE: FaqCluster[] = [
  {
    id: "comprar",
    title: "Comprar",
    items: [
      {
        question: "¿Cuándo se paga al vendedor?",
        answer: "Después de que marques «Ya recibí».",
      },
    ],
  },
  {
    id: "seguridad",
    title: "Seguridad",
    items: [
      {
        question: "¿Revisan IMEI y Activation Lock?",
        answer: "Sí. Pedimos IMEI y comprobamos el bloqueo de activación.",
      },
    ],
  },
];

describe("filterFaqClusters", () => {
  it("returns all clusters when the query is blank", () => {
    assert.equal(filterFaqClusters(SAMPLE, "  ").length, 2);
  });

  it("matches a question case-insensitively", () => {
    const result = filterFaqClusters(SAMPLE, "imei");
    assert.equal(result.length, 1);
    assert.equal(result[0].id, "seguridad");
    assert.equal(result[0].items.length, 1);
  });

  it("matches an answer and drops empty clusters", () => {
    const result = filterFaqClusters(SAMPLE, "Ya recibí");
    assert.equal(result.length, 1);
    assert.equal(result[0].id, "comprar");
  });

  it("returns no clusters when nothing matches", () => {
    assert.deepEqual(filterFaqClusters(SAMPLE, "Wompi no aparece"), []);
  });
});
