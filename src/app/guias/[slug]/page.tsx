/**
 * @file page.tsx
 * @description Public guide detail at /guias/[slug].
 * @dependencies AppShell, SiteFooter, GuideMarkdown, extractGuideFaqs, getSiteUrl
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SiteFooter } from "@/components/site-footer";
import { GuideMarkdown } from "@/features/guias/components/guide-markdown";
import { extractGuideFaqs } from "@/lib/guias/extract-guide-faqs";
import { formatGuideDate } from "@/lib/guias/format-guide-date";
import { getGuideBySlug, getPublishedGuides } from "@/lib/guias/load-guides";
import { LEGAL_PATHS } from "@/lib/legal";
import { getSiteUrl } from "@/lib/site-url";

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
 * Uses guide front matter for title, description, canonical URL, and Open Graph.
 */
export async function generateMetadata({
  params,
}: GuiaDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return { title: "Guía no encontrada", robots: { index: false } };
  }

  const canonical = `${getSiteUrl()}/guias/${guide.slug}`;
  const title = guide.metaTitle || guide.title;

  return {
    title,
    description: guide.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: `${title} · TruePhone`,
      description: guide.metaDescription,
      type: "article",
      url: canonical,
      ...(guide.coverImage
        ? { images: [{ url: guide.coverImage, alt: guide.heading }] }
        : {}),
    },
  };
}

/**
 * JsonLd
 *
 * Serializes a schema.org object into an application/ld+json script tag.
 *
 * @param props.data - Plain object following schema.org vocabulary.
 * @returns Script element for crawlers.
 */
function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
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
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/guias/${guide.slug}`;
  const faqs = extractGuideFaqs(guide.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.heading,
        description: guide.metaDescription,
        inLanguage: "es-CO",
        datePublished: guide.publishedAt,
        dateModified: guide.updatedAt,
        author: { "@type": "Organization", name: "TruePhone" },
        publisher: {
          "@type": "Organization",
          name: "TruePhone",
          url: siteUrl,
        },
        mainEntityOfPage: canonical,
        ...(guide.coverImage
          ? { image: [`${siteUrl}${guide.coverImage}`] }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: `${siteUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Guías",
            item: `${siteUrl}/guias`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: guide.heading,
          },
        ],
      },
      ...(faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
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
            Por {guide.author} · Actualizado: {formatGuideDate(guide.updatedAt)}
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
              Explora anuncios revisados
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
              href={`${LEGAL_PATHS.help}#seguridad`}
              className="text-trust text-sm font-medium underline-offset-4 hover:underline"
            >
              Ayuda: seguridad
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
                      {entry.heading}
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
