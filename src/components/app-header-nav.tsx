"use client";

/**
 * @file app-header-nav.tsx
 * @description Client header brand and primary nav links with route-aware active states.
 * @dependencies next/image, next/link, next/navigation, @/lib/utils
 */

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const homeHref = "/?ref=inicio";

type NavLinkProps = {
  href: string;
  label: string;
  active: boolean;
};

/**
 * NavLink
 *
 * Renders a primary nav item with active/inactive styling.
 *
 * @param props.href - Destination path.
 * @param props.label - Visible link text.
 * @param props.active - Whether the current route matches this item.
 */
function NavLink({ href, label, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

type AppHeaderBrandLinkProps = {
  className?: string;
  /** Rendered icon height in CSS px (asset is 1:2, width = half). Defaults to 24 (mobile). */
  iconHeight?: number;
};

/**
 * AppHeaderBrandLink
 *
 * TruePhone brand icon + wordmark linking to marketing home with explicit Inicio semantics.
 * The icon is decorative (`alt=""`); the wordmark text labels the link.
 *
 * @param props.className - Optional link className.
 * @param props.iconHeight - Icon height in px (24 mobile, 28 desktop); width is half.
 */
export function AppHeaderBrandLink({
  className,
  iconHeight = 24,
}: AppHeaderBrandLinkProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <Link
      href={homeHref}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 font-semibold tracking-tight transition-colors",
        isHome ? "text-foreground" : "text-foreground hover:text-foreground/90",
        className,
      )}
      aria-current={isHome ? "page" : undefined}
    >
      {/* 64x128 source served as-is: tiny, and crisp up to ~4x DPR without the optimizer. */}
      <Image
        src="/brand/truephone-icon.png"
        alt=""
        aria-hidden
        width={iconHeight / 2}
        height={iconHeight}
        preload
        unoptimized
        className="shrink-0"
      />
      <span>TruePhone</span>
    </Link>
  );
}

/**
 * AppHeaderNav
 *
 * Desktop primary nav: Explorar and Anuncios with route-aware highlights.
 */
export function AppHeaderNav() {
  const pathname = usePathname();
  const explorarActive =
    pathname.startsWith("/explorar") || pathname.startsWith("/buscar");
  const anunciosActive = pathname.startsWith("/anuncios");

  return (
    <nav className="flex items-center gap-6" aria-label="Principal">
      <NavLink href="/explorar" label="Explorar" active={explorarActive} />
      <NavLink href="/anuncios" label="Anuncios" active={anunciosActive} />
    </nav>
  );
}
