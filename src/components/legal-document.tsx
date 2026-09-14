/**
 * @file legal-document.tsx
 * @description Shared public layout for privacy, terms, and cookie policy pages.
 * @dependencies next/link, AppShell, SiteFooter, Button, @/lib/legal
 */

import Link from "next/link";
import { Fragment } from "react";

import { AppShell } from "@/components/app-shell";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_CONTACT_MAILTO,
  LEGAL_LAST_UPDATED_LABEL,
  LEGAL_PATHS,
  type LegalDocument as LegalDocumentData,
} from "@/lib/legal";

const SIBLING_LINKS = [
  { href: LEGAL_PATHS.privacy, label: "Privacidad" },
  { href: LEGAL_PATHS.terms, label: "Términos" },
  { href: LEGAL_PATHS.cookies, label: "Cookies" },
] as const;

type LegalDocumentProps = {
  document: LegalDocumentData;
  currentPath: (typeof SIBLING_LINKS)[number]["href"];
};

/**
 * linkLegalEmails
 *
 * Turns the operator contact email inside a paragraph into a mailto link.
 *
 * @param text - Section paragraph that may include LEGAL_CONTACT_EMAIL.
 * @returns React nodes with linked emails.
 * @calledBy LegalDocument
 */
function linkLegalEmails(text: string) {
  const parts = text.split(LEGAL_CONTACT_EMAIL);
  if (parts.length === 1) return text;

  return parts.map((part, index) => (
    <Fragment key={index}>
      {part}
      {index < parts.length - 1 ? (
        <a
          href={LEGAL_CONTACT_MAILTO}
          className="text-foreground font-medium underline-offset-2 hover:underline"
        >
          {LEGAL_CONTACT_EMAIL}
        </a>
      ) : null}
    </Fragment>
  ));
}

/**
 * LegalDocument
 *
 * Renders a legal page: title, optional summary, sticky section chips, and body.
 *
 * @param props.document - Title, description, optional summary, and sections.
 * @param props.currentPath - Active legal route, used to skip the self-link.
 * @returns AppShell + footer layout matching /ayuda.
 * @calledBy /privacidad, /terminos, /cookies pages
 */
export function LegalDocument({ document, currentPath }: LegalDocumentProps) {
  return (
    <>
      <AppShell mainClassName="gap-10 md:gap-12">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
            {document.title}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {document.description}
          </p>
          <p className="text-muted-foreground text-xs">
            Última actualización: {LEGAL_LAST_UPDATED_LABEL}
          </p>
        </div>

        {document.summary ? (
          <aside className="border-border bg-muted/40 mx-auto w-full max-w-2xl space-y-3 rounded-xl border px-4 py-4">
            <h2 className="text-foreground text-sm font-semibold tracking-tight">
              {document.summary.title}
            </h2>
            <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm leading-relaxed">
              {document.summary.bullets.map((item) => (
                <li key={item}>{linkLegalEmails(item)}</li>
              ))}
            </ul>
          </aside>
        ) : null}

        <div className="sticky top-14 z-20 -mx-4 px-4 md:top-16">
          <nav
            aria-label="Secciones"
            className="tp-glass border-border mx-auto flex max-w-2xl [scrollbar-width:none] gap-2 overflow-x-auto rounded-xl border px-3 py-3 backdrop-blur-md backdrop-saturate-[1.1] [-ms-overflow-style:none] motion-reduce:backdrop-blur-none [&::-webkit-scrollbar]:hidden"
          >
            {document.sections.map((section) => (
              <Link
                key={section.id}
                href={`#${section.id}`}
                className="border-border bg-muted/40 text-foreground hover:bg-muted shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium"
              >
                {section.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mx-auto w-full max-w-2xl space-y-10">
          {document.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-36 space-y-3 md:scroll-mt-40"
            >
              <h2 className="text-foreground text-lg font-semibold tracking-tight">
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-muted-foreground text-sm leading-relaxed"
                >
                  {linkLegalEmails(paragraph)}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm leading-relaxed">
                  {section.bullets.map((item) => (
                    <li key={item}>{linkLegalEmails(item)}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <div className="border-border space-y-4 border-t pt-6">
            <Button asChild>
              <Link href={LEGAL_PATHS.help}>Ir a Ayuda</Link>
            </Button>
            <nav
              aria-label="Documentos legales"
              className="flex flex-wrap gap-x-4 gap-y-2"
            >
              {SIBLING_LINKS.filter((link) => link.href !== currentPath).map(
                (link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-trust text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </nav>
          </div>
        </div>
      </AppShell>
      <SiteFooter />
    </>
  );
}
