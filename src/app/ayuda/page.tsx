/**
 * @file page.tsx
 * @description Public FAQ / help center at /ayuda (Phase 23 thin slice).
 * @dependencies AppShell, SiteFooter, FAQ_CLUSTERS
 */

import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { SiteFooter } from "@/components/site-footer";
import { FAQ_CLUSTERS } from "@/lib/help/faq";

export const metadata: Metadata = {
  title: "Ayuda",
  description:
    "Preguntas frecuentes de TruePhone: comprar, vender, envíos, pagos y seguridad.",
};

/**
 * AyudaPage
 *
 * Renders Spanish FAQ clusters with in-page anchors for footer and empty states.
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
            Respuestas cortas sobre cómo funciona TruePhone. Si no encuentras lo
            que buscas, escribe a{" "}
            <a
              href="mailto:hola@truephone.co"
              className="text-foreground font-medium underline-offset-2 hover:underline"
            >
              hola@truephone.co
            </a>
            .
          </p>
        </div>

        <nav
          aria-label="Temas de ayuda"
          className="mx-auto flex max-w-2xl flex-wrap justify-center gap-2"
        >
          {FAQ_CLUSTERS.map((cluster) => (
            <Link
              key={cluster.id}
              href={`#${cluster.id}`}
              className="border-border bg-muted/40 text-foreground hover:bg-muted rounded-full border px-3 py-1.5 text-xs font-medium"
            >
              {cluster.title}
            </Link>
          ))}
        </nav>

        <div className="mx-auto w-full max-w-2xl space-y-10">
          {FAQ_CLUSTERS.map((cluster) => (
            <section
              key={cluster.id}
              id={cluster.id}
              className="scroll-mt-24 space-y-4"
            >
              <h2 className="text-foreground text-lg font-semibold tracking-tight">
                {cluster.title}
              </h2>
              <ul className="space-y-3">
                {cluster.items.map((item) => (
                  <li key={item.question}>
                    <details className="border-border bg-card rounded-xl border px-4 py-3">
                      <summary className="text-foreground cursor-pointer text-sm font-medium">
                        {item.question}
                      </summary>
                      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        {item.answer}
                      </p>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </AppShell>
      <SiteFooter />
    </>
  );
}
