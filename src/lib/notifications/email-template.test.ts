/**
 * @file email-template.test.ts
 * @description Unit tests for branded notification email HTML and text.
 * @dependencies node:test, email-template
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { LEGAL_CONTACT_EMAIL } from "@/lib/legal";
import {
  absoluteEmailUrl,
  buildNotificationEmail,
  escapeEmailHtml,
  renderNotificationEmailHtml,
} from "@/lib/notifications/email-template";

describe("email-template", () => {
  it("joins origin and path without a double slash", () => {
    assert.equal(
      absoluteEmailUrl("https://truephone.co/", "/compras/1"),
      "https://truephone.co/compras/1",
    );
  });

  it("escapes HTML in title and body", () => {
    const html = renderNotificationEmailHtml({
      title: `Oferta <script>alert(1)</script>`,
      body: `Compra "segura" & rápida`,
      siteOrigin: "https://truephone.co",
      href: "/compras/1",
      ctaLabel: "Ver pedido",
    });

    assert.equal(html.includes("<script>"), false);
    assert.equal(html.includes("&lt;script&gt;"), true);
    assert.equal(html.includes("&amp;"), true);
    assert.equal(html.includes("&quot;segura&quot;"), true);
  });

  it("includes CTA, help, and legal footer links", () => {
    const built = buildNotificationEmail({
      subject: "TruePhone: confirma tu iPhone",
      title: "Confirma tu iPhone en 24 horas",
      body: "Registramos que recibiste el dispositivo.",
      siteOrigin: "https://truephone.co",
      href: "/compras/ord_1",
      ctaLabel: "Confirmar o reportar un problema",
      extraTextLines: ["La batería con caída ≤1% no es motivo de reporte."],
    });

    assert.equal(built.emailSubject, "TruePhone: confirma tu iPhone");
    assert.equal(
      built.emailText.includes("https://truephone.co/compras/ord_1"),
      true,
    );
    assert.equal(
      built.emailHtml.includes("https://truephone.co/compras/ord_1"),
      true,
    );
    assert.equal(built.emailHtml.includes("https://truephone.co/ayuda"), true);
    assert.equal(
      built.emailHtml.includes("https://truephone.co/privacidad"),
      true,
    );
    assert.equal(
      built.emailHtml.includes("https://truephone.co/terminos"),
      true,
    );
    assert.equal(
      built.emailHtml.includes("https://truephone.co/cookies"),
      true,
    );
    assert.equal(built.emailHtml.includes(LEGAL_CONTACT_EMAIL), true);
    assert.equal(
      built.emailHtml.includes("Confirmar o reportar un problema"),
      true,
    );
    assert.equal(
      built.emailHtml.includes(
        "La batería con caída ≤1% no es motivo de reporte.",
      ),
      true,
    );
    assert.equal(escapeEmailHtml("<x>"), "&lt;x&gt;");
  });
});
