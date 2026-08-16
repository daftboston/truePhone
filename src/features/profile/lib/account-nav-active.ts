/**
 * @file account-nav-active.ts
 * @description Pure active-state rules for Mi TruePhone sidebar items.
 * @dependencies none
 */

export type AccountNavActiveItem = {
  href?: string;
  exact?: boolean;
  soon?: boolean;
  /** Disambiguates Verificación when its href was historically `/vender`. */
  match?: "verification";
};

/**
 * isAccountNavItemActive
 *
 * Returns whether a sidebar item should show as the current page.
 * Verificación only matches `/verificacion` routes. Mis anuncios only
 * matches the listing list (`/vender`), not wizard or detail URLs.
 *
 * @param pathname - Current Next.js pathname.
 * @param item - Nav item to test.
 * @returns True when the item is the current page.
 * @calledBy AccountNav
 *
 * @example
 * isAccountNavItemActive("/vender", { href: "/vender" }); // true
 * isAccountNavItemActive("/vender", { href: "/vender", match: "verification" }); // false
 */
export function isAccountNavItemActive(
  pathname: string,
  item: AccountNavActiveItem,
) {
  if (!item.href || item.soon) return false;

  if (item.match === "verification") {
    return (
      pathname === "/verificacion" || pathname.startsWith("/verificacion/")
    );
  }

  if (item.exact) return pathname === item.href;

  // Mis anuncios: only the list page, not wizard/detail routes.
  if (item.href === "/vender") {
    return pathname === "/vender";
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
