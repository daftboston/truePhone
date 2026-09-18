"use client";

/**
 * @file app-header-nav.tsx
 * @description Client header brand and primary nav links with route-aware active states.
 * @dependencies next/link, next/navigation, @/lib/utils
 */

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
};

/**
 * AppHeaderBrandLink
 *
 * TruePhone wordmark linking to marketing home with explicit Inicio semantics.
 *
 * @param props.className - Optional link className.
 */
export function AppHeaderBrandLink({ className }: AppHeaderBrandLinkProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <Link
      href={homeHref}
      className={cn(
        "shrink-0 font-semibold tracking-tight transition-colors",
        isHome ? "text-foreground" : "text-foreground hover:text-foreground/90",
        className,
      )}
      aria-current={isHome ? "page" : undefined}
    >
      TruePhone
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
