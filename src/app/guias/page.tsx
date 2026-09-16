/**
 * @file page.tsx
 * @description Public guides index at /guias.
 * @dependencies AppShell, SiteFooter, @/lib/guias/load-guides
 */

import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { SiteFooter } from "@/components/site-footer";
import { formatGuideDate } from "@/lib/guias/format-guide-date";
import { getPublishedGuideSummaries } from "@/lib/guias/load-guides";
import { LEGAL_PATHS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Guías",
  description:
    "Guías prácticas para comprar iPhone usado con más seguridad en Colombia.",
};

/**
 * GuiasIndexPage
 *
 * Lists published SEO guides from content/guias.
 *
 * @returns Guides index with cards linking to each slug.
 */
export default function GuiasIndexPage() {
  const guides = getPublishedGuideSummaries();

  return (
    <>
      <AppShell mainClassName="gap-10 md:gap-12">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
            Guías
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Consejos claros para comprar y vender iPhone usado con más
            tranquilidad. Si necesitas ayuda con un pedido, visita{" "}
            <Link
              href={LEGAL_PATHS.help}
              className="text-foreground font-medium underline-offset-2 hover:underline"
            >
              Ayuda
            </Link>{" "}
            o{" "}
            <Link
              href={LEGAL_PATHS.pqr}
              className="text-foreground font-medium underline-offset-2 hover:underline"
            >
              PQR
            </Link>
            .
          </p>
        </div>

        {guides.length === 0 ? (
          <p className="text-muted-foreground mx-auto max-w-2xl text-center text-sm">
            Pronto publicaremos nuevas guías.
          </p>
        ) : (
          <ul className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            {guides.map((guide) => (
              <li key={guide.slug}>
                <Link
                  href={`/guias/${guide.slug}`}
                  className="border-border bg-card hover:bg-muted/40 block rounded-xl border p-5 transition-colors"
                >
                  <h2 className="text-foreground text-base font-semibold tracking-tight">
                    {guide.heading}
                  </h2>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {guide.metaDescription}
                  </p>
                  <p className="text-muted-foreground mt-3 text-xs">
                    Actualizado: {formatGuideDate(guide.updatedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mx-auto flex w-full max-w-2xl flex-wrap gap-x-4 gap-y-2">
          <Link
            href="/explorar"
            className="text-trust text-sm font-medium underline-offset-4 hover:underline"
          >
            Explorar anuncios
          </Link>
          <Link
            href={LEGAL_PATHS.terms}
            className="text-trust text-sm font-medium underline-offset-4 hover:underline"
          >
            Términos
          </Link>
        </div>
      </AppShell>
      <SiteFooter />
    </>
  );
}
