/**
 * @file site-url.ts
 * @description Canonical public site URL for sitemap and robots metadata.
 * @dependencies none
 */

const DEFAULT_SITE_URL = "https://www.truephone.shop";

/**
 * getSiteUrl
 *
 * Returns the configured public site URL without a trailing slash.
 *
 * @returns Absolute origin for SEO metadata routes.
 * @calledBy sitemap.ts, robots.ts
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  return configured || DEFAULT_SITE_URL;
}
