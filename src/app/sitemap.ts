/**
 * @file sitemap.ts
 * @description App Router sitemap including guides and core public routes.
 * @dependencies next, @/lib/guias/load-guides, @/lib/legal, @/lib/site-url
 */

import type { MetadataRoute } from "next";

import { getPublishedGuides } from "@/lib/guias/load-guides";
import { LEGAL_PATHS } from "@/lib/legal";
import { getSiteUrl } from "@/lib/site-url";

/**
 * sitemap
 *
 * Exposes public marketing, help, legal, and guide URLs for crawlers.
 *
 * @returns Sitemap entries for the site.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const guides = getPublishedGuides();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/explorar`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/anuncios`,
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/guias`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}${LEGAL_PATHS.help}`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}${LEGAL_PATHS.terms}`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}${LEGAL_PATHS.privacy}`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}${LEGAL_PATHS.cookies}`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}${LEGAL_PATHS.pqr}`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const guideRoutes: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${siteUrl}/guias/${guide.slug}`,
    lastModified: guide.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...guideRoutes];
}
