/**
 * @file extract-guide-faqs.test.ts
 * @description Unit tests for guide FAQ extraction used in FAQPage JSON-LD.
 * @dependencies node:test, node:assert/strict, @/lib/guias/extract-guide-faqs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { extractGuideFaqs } from "@/lib/guias/extract-guide-faqs";

describe("extractGuideFaqs", () => {
  it("reads bold question lines from the FAQ section", () => {
    const content = `## Proceso

Texto.

## Preguntas frecuentes

**¿Es seguro comprar iPhone usado en Marketplace?** Puede serlo si verificas en persona.

**¿WhatsApp es siempre una estafa?** No. La alerta es la presión para pagar.

---

_Nota._
`;

    assert.deepEqual(extractGuideFaqs(content), [
      {
        question: "¿Es seguro comprar iPhone usado en Marketplace?",
        answer: "Puede serlo si verificas en persona.",
      },
      {
        question: "¿WhatsApp es siempre una estafa?",
        answer: "No. La alerta es la presión para pagar.",
      },
    ]);
  });

  it("returns an empty list when the FAQ heading is missing", () => {
    assert.deepEqual(extractGuideFaqs("## Otro\n\nHola."), []);
  });

  it("extracts the four FAQs from the published estafas guide", () => {
    const raw = readFileSync(
      path.join(
        process.cwd(),
        "content/guias/estafas-iphone-marketplace-whatsapp-colombia.md",
      ),
      "utf8",
    );

    const faqs = extractGuideFaqs(raw);

    assert.equal(faqs.length, 4);
    assert.equal(
      faqs[0]?.question,
      "¿Es seguro comprar iPhone usado en Marketplace?",
    );
  });
});
