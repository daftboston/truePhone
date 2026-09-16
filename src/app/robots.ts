/**
 * @file robots.ts
 * @description App Router robots.txt pointing crawlers to the sitemap.
 * @dependencies next, @/lib/site-url
 */

import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

/**
 * robots
 *
 * Allows indexing of public pages and references the sitemap.
 *
 * @returns Robots policy for search engines.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
