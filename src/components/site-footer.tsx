/**
 * @file site-footer.tsx
 * @description Slim marketing footer with legal links and brand mark.
 * @dependencies next/link, @/lib/legal, @/lib/utils
 * @changelog 2026-09-14 — Colombia contact line; optional entity slots when filled.
 */

import Link from "next/link";

import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_CONTACT_MAILTO,
  LEGAL_JUDICIAL_ADDRESS,
  LEGAL_JURISDICTION,
  LEGAL_NIT,
  LEGAL_PATHS,
  LEGAL_PHONE,
  LEGAL_RAZON_SOCIAL,
} from "@/lib/legal";
import { cn, SHELL_WIDTH_CLASS } from "@/lib/utils";

const legalLinks = [
  { href: LEGAL_PATHS.help, label: "Ayuda" },
  { href: LEGAL_PATHS.privacy, label: "Privacidad" },
  { href: LEGAL_PATHS.terms, label: "Términos" },
  { href: LEGAL_PATHS.cookies, label: "Cookies" },
  { href: `${LEGAL_PATHS.help}#comprar`, label: "Protección al comprador" },
  { href: LEGAL_CONTACT_MAILTO, label: "Contacto" },
] as const;

type SiteFooterProps = {
  className?: string;
};

/**
 * SiteFooter
 *
 * Renders legal links and copyright. Trust pillars live on the home trust strip
 * so this footer does not repeat them.
 *
 * @param props.className - Optional footer className.
 * @returns Site footer element.
 * @calledBy HomePage, ayuda, and legal layouts
 */
export function SiteFooter({ className }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const entityLines = [
    LEGAL_RAZON_SOCIAL,
    LEGAL_NIT ? `NIT ${LEGAL_NIT}` : "",
    LEGAL_JUDICIAL_ADDRESS,
    LEGAL_PHONE,
  ].filter(Boolean);

  return (
    <footer className={cn("bg-background border-border border-t", className)}>
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-6 px-4 py-8 pb-24 md:flex-row md:items-end md:justify-between md:px-6 md:pb-10",
          SHELL_WIDTH_CLASS,
        )}
      >
        <div className="space-y-1">
          <p className="text-foreground text-base font-semibold tracking-tight">
            TruePhone
          </p>
          <p className="text-muted-foreground text-xs md:text-sm">
            TruePhone · {LEGAL_JURISDICTION} · {LEGAL_CONTACT_EMAIL}
          </p>
          {entityLines.length > 0 ? (
            <p className="text-muted-foreground text-xs md:text-sm">
              {entityLines.join(" · ")}
            </p>
          ) : null}
          <p className="text-muted-foreground text-xs md:text-sm">
            © {year} TruePhone · Cada anuncio es revisado manualmente antes de
            publicarse.
          </p>
        </div>
        <nav
          aria-label="Legal"
          className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end"
        >
          {legalLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm underline-offset-2 hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
