/**
 * @file types.ts
 * @description Shared types for public SEO guides loaded from content/guias.
 * @dependencies none
 */

/**
 * Normalized front matter after merging shape A (title, description, h1)
 * and shape B (metaTitle, metaDescription, published, keywords).
 */
export type GuideFrontMatter = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  locale: string;
  published: boolean;
  publishedAt: string;
  updatedAt: string;
  author: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  /** Optional public path for hero/OG image (e.g. /guias/foo-hero.png). */
  coverImage?: string;
};

/** Parsed guide ready for index/detail pages. */
export type Guide = GuideFrontMatter & {
  /** Markdown body with NOTES section and leading H1 removed. */
  content: string;
  /** Display H1: `h1` front matter, first `#` in body, or `title`. */
  heading: string;
};

/** Minimal guide row for index cards. */
export type GuideSummary = Pick<
  Guide,
  "slug" | "heading" | "metaDescription" | "publishedAt" | "updatedAt"
>;
