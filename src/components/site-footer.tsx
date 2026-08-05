/**
 * @file site-footer.tsx
 * @description Marketing footer with trust pillars, support links, and brand mark.
 * @dependencies next/link, lucide-react, @/lib/utils
 */

import Link from "next/link";
import {
  BadgeCheck,
  Handshake,
  MessageCircle,
  ScanLine,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const pillars = [
  {
    title: "Revisión manual",
    description:
      "Cada anuncio lo valida un revisor de TruePhone antes de publicarse.",
    href: "/explorar",
    linkLabel: "Ver anuncios",
    icon: ShieldCheck,
  },
  {
    title: "Vendedores verificados",
    description:
      "Quien vende confirma identidad con cédula y selfie revisadas.",
    href: "/verificacion",
    linkLabel: "Cómo verificar",
    icon: BadgeCheck,
  },
  {
    title: "Compra garantizada",
    description:
      "Compras con protección TruePhone y transparencia en el precio.",
    href: "/explorar",
    linkLabel: "Explorar iPhones",
    icon: Handshake,
  },
  {
    title: "Fees claros",
    description:
      "Ves el precio del equipo y la protección por separado, sin sorpresas.",
    href: "/explorar",
    linkLabel: "Ver precios",
    icon: Wallet,
  },
  {
    title: "IMEI y posesión",
    description: "Validamos IMEI y pedimos prueba de posesión del dispositivo.",
    href: "/vender",
    linkLabel: "Vender con confianza",
    icon: ScanLine,
  },
  {
    title: "Soporte humano",
    description: "Si algo no cuadra, hablas con personas — no solo con un bot.",
    href: "mailto:hola@truephone.co",
    linkLabel: "Contactar",
    icon: MessageCircle,
  },
] as const;

const legalLinks = [
  { href: "/#privacidad", label: "Privacidad" },
  { href: "/#terminos", label: "Términos" },
  { href: "/#proteccion", label: "Protección al comprador" },
  { href: "mailto:hola@truephone.co", label: "Contacto" },
] as const;

type SiteFooterProps = {
  className?: string;
};

/**
 * SiteFooter
 *
 * Renders home/marketing footer content: pillars, links, and copyright.
 *
 * @param props.className - Optional footer className.
 * @returns Site footer element.
 * @calledBy HomePage and other marketing layouts
 */
export function SiteFooter({ className }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("bg-background border-border border-t", className)}>
      <section className="bg-muted/60 border-border border-b">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <div className="mx-auto max-w-2xl space-y-2 text-center">
            <h2 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
              Por qué TruePhone
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              El marketplace más confiable para comprar y vender iPhones usados
              en Colombia.
            </p>
          </div>

          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <li
                  key={pillar.title}
                  className="flex flex-col items-center space-y-3 text-center"
                >
                  <span className="bg-trust/10 text-trust flex size-12 items-center justify-center rounded-full">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="text-foreground text-base font-semibold">
                    {pillar.title}
                  </h3>
                  <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                    {pillar.description}
                  </p>
                  <Link
                    href={pillar.href}
                    className="text-trust text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {pillar.linkLabel}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 pb-24 md:flex-row md:items-end md:justify-between md:px-6 md:pb-10">
        <div className="space-y-1">
          <p className="text-foreground text-base font-semibold tracking-tight">
            TruePhone
          </p>
          <p className="text-muted-foreground text-xs md:text-sm">
            © {year} TruePhone · El marketplace confiable de iPhones en
            Colombia.
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
