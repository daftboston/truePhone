/**
 * @file page.tsx
 * @description Public FAQ / help center at /ayuda (Phase 23 thin slice).
 * @dependencies AppShell, SiteFooter, FaqList, FAQ_CLUSTERS
 */

import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { SiteFooter } from "@/components/site-footer";
import { FaqList } from "@/features/help/components/faq-list";
import { FAQ_CLUSTERS } from "@/lib/help/faq";
import { LEGAL_CONTACT_EMAIL, LEGAL_CONTACT_MAILTO } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Ayuda",
  description:
    "Preguntas frecuentes de TruePhone: cobros, retracto, comprar, vender, envíos, pagos y seguridad.",
};

/**
 * AyudaPage
 *
 * Renders Spanish FAQ clusters with in-page search and topic chips.
 *
 * @returns Public help page.
 */
export default function AyudaPage() {
  return (
    <>
      <AppShell mainClassName="gap-10 md:gap-12">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
            Ayuda
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Respuestas sobre cómo funciona TruePhone: cobros, retracto, envíos y
            más. Si no encuentras lo que buscas, escribe a{" "}
            <a
              href={LEGAL_CONTACT_MAILTO}
              className="text-foreground font-medium underline-offset-2 hover:underline"
            >
              {LEGAL_CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>

        <FaqList clusters={FAQ_CLUSTERS} />
      </AppShell>
      <SiteFooter />
    </>
  );
}
