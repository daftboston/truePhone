/**
 * @file types.ts
 * @description Shared types for public SEO guides loaded from content/guias.
 * @dependencies none
 */

/** Front matter fields for a guide markdown file. */
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
};

/** Parsed guide ready for index/detail pages. */
export type Guide = GuideFrontMatter & {
  /** Markdown body with NOTES section and leading H1 removed. */
  content: string;
  /** Display heading from the first `#` in the body, or `title`. */
  heading: string;
};

/** Minimal guide row for index cards. */
export type GuideSummary = Pick<
  Guide,
  "slug" | "title" | "metaDescription" | "publishedAt" | "updatedAt"
>;
