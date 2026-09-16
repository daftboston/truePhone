/**
 * @file page.tsx
 * @description Public guide detail at /guias/[slug].
 * @dependencies AppShell, SiteFooter, GuideMarkdown, @/lib/guias/load-guides
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SiteFooter } from "@/components/site-footer";
import { GuideMarkdown } from "@/features/guias/components/guide-markdown";
import { formatGuideDate } from "@/lib/guias/format-guide-date";
import {
  getGuideBySlug,
  getPublishedGuides,
} from "@/lib/guias/load-guides";
import { LEGAL_PATHS } from "@/lib/legal";

type GuiaDetailPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * generateStaticParams
 *
 * Pre-renders all published guide slugs at build time.
 */
export function generateStaticParams() {
  return getPublishedGuides().map((guide) => ({ slug: guide.slug }));
}

/**
 * generateMetadata
 *
 * Uses guide front matter for SEO title and description.
 */
export async function generateMetadata({
  params,
}: GuiaDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {};
  }

  return {
    title: guide.metaTitle || guide.title,
    description: guide.metaDescription,
  };
}

/**
 * GuiaDetailPage
 *
 * Renders one published guide from content/guias.
 *
 * @param props.params - Dynamic slug segment.
 * @returns Guide detail page or 404 when unpublished/missing.
 */
export default async function GuiaDetailPage({ params }: GuiaDetailPageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const otherGuides = getPublishedGuides().filter(
    (entry) => entry.slug !== guide.slug,
  );

  return (
    <>
      <AppShell mainClassName="gap-10 md:gap-12">
        <header className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="text-muted-foreground text-xs">
            <Link
              href="/guias"
              className="text-foreground font-medium underline-offset-2 hover:underline"
            >
              Guías
            </Link>
          </p>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
            {guide.heading}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {guide.metaDescription}
          </p>
          <p className="text-muted-foreground text-xs">
            Por {guide.author} · Actualizado:{" "}
            {formatGuideDate(guide.updatedAt)}
          </p>
        </header>

        <GuideMarkdown content={guide.content} />

        <footer className="border-border mx-auto w-full max-w-2xl space-y-4 border-t pt-6">
          <p className="text-muted-foreground text-sm leading-relaxed">
            ¿Buscas un iPhone usado con revisión previa?{" "}
            <Link
              href="/explorar"
              className="text-trust font-medium underline-offset-4 hover:underline"
            >
              Explora anuncios verificados
            </Link>
            .
          </p>
          <nav
            aria-label="Enlaces relacionados"
            className="flex flex-wrap gap-x-4 gap-y-2"
          >
            <Link
              href="/guias"
              className="text-trust text-sm font-medium underline-offset-4 hover:underline"
            >
              Todas las guías
            </Link>
            <Link
              href={LEGAL_PATHS.help}
              className="text-trust text-sm font-medium underline-offset-4 hover:underline"
            >
              Ayuda
            </Link>
            <Link
              href={LEGAL_PATHS.terms}
              className="text-trust text-sm font-medium underline-offset-4 hover:underline"
            >
              Términos
            </Link>
            <Link
              href={LEGAL_PATHS.pqr}
              className="text-trust text-sm font-medium underline-offset-4 hover:underline"
            >
              PQR
            </Link>
          </nav>
          {otherGuides.length > 0 ? (
            <div className="space-y-2">
              <h2 className="text-foreground text-sm font-semibold tracking-tight">
                Más guías
              </h2>
              <ul className="space-y-2">
                {otherGuides.map((entry) => (
                  <li key={entry.slug}>
                    <Link
                      href={`/guias/${entry.slug}`}
                      className="text-trust text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {entry.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </footer>
      </AppShell>
      <SiteFooter />
    </>
  );
}
