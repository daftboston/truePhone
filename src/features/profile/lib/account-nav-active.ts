/**
 * @file account-nav-active.ts
 * @description Pure active-state rules for Mi TruePhone sidebar items.
 * @dependencies @/features/listings/lib/seller-listing-hub
 */

import { isArchivedVistaSearch } from "@/features/listings/lib/seller-listing-hub";

export type AccountNavActiveItem = {
  href?: string;
  exact?: boolean;
  soon?: boolean;
  /** Disambiguates Verificación when its href was historically `/vender`. */
  match?: "verification";
};

/**
 * splitNavHref
 *
 * Splits a nav href into pathname and query string without a leading `?`.
 *
 * @param href - Nav item href.
 * @returns Path and search parts.
 * @calledBy isAccountNavItemActive
 */
function splitNavHref(href: string) {
  const queryIndex = href.indexOf("?");
  if (queryIndex === -1) {
    return { path: href, search: "" };
  }
  return {
    path: href.slice(0, queryIndex),
    search: href.slice(queryIndex + 1),
  };
}

/**
 * isAccountNavItemActive
 *
 * Returns whether a sidebar item should show as the current page.
 * Verificación only matches `/verificacion` routes. Anuncios activos and
 * Archivados only match the listing list (`/vender`), not wizard or detail URLs,
 * and are distinguished by `vista=archivados`.
 *
 * @param pathname - Current Next.js pathname.
 * @param item - Nav item to test.
 * @param search - Current query string (with or without `?`).
 * @returns True when the item is the current page.
 * @calledBy AccountNav
 *
 * @example
 * isAccountNavItemActive("/vender", { href: "/vender" }); // true
 * isAccountNavItemActive("/vender", { href: "/vender?vista=archivados" }, "vista=archivados"); // true
 */
export function isAccountNavItemActive(
  pathname: string,
  item: AccountNavActiveItem,
  search = "",
) {
  if (!item.href || item.soon) return false;

  if (item.match === "verification") {
    return (
      pathname === "/verificacion" || pathname.startsWith("/verificacion/")
    );
  }

  if (item.exact) return pathname === item.href;

  const { path: itemPath, search: itemSearch } = splitNavHref(item.href);

  // Seller listing hub: only the list page, not wizard/detail routes.
  if (itemPath === "/vender") {
    if (pathname !== "/vender") return false;
    return isArchivedVistaSearch(itemSearch) === isArchivedVistaSearch(search);
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
