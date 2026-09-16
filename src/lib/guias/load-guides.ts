/**
 * @file load-guides.ts
 * @description Reads and parses published guides from content/guias at build time.
 * @dependencies fs, path, gray-matter, @/lib/guias/types
 */

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import type { Guide, GuideFrontMatter, GuideSummary } from "@/lib/guias/types";

const GUIDES_DIR = path.join(process.cwd(), "content/guias");

const NOTES_SECTION_PATTERN = /^##\s+NOTES FOR DANIEL\b[\s\S]*/im;

/**
 * stripNotesSection
 *
 * Removes the internal "## NOTES FOR DANIEL" block if present.
 *
 * @param content - Raw markdown body.
 * @returns Body without the notes section.
 */
function stripNotesSection(content: string): string {
  return content.replace(NOTES_SECTION_PATTERN, "").trim();
}

/**
 * extractHeading
 *
 * Pulls the first markdown H1 for the page title and removes it from the body.
 *
 * @param content - Markdown body after notes are stripped.
 * @param fallbackTitle - Front matter title when no H1 exists.
 * @returns Heading text and remaining markdown.
 */
function extractHeading(
  content: string,
  fallbackTitle: string,
): { heading: string; body: string } {
  const match = content.match(/^#\s+(.+)$/m);

  if (!match) {
    return { heading: fallbackTitle, body: content.trim() };
  }

  const heading = match[1].trim();
  const body = content.replace(/^#\s+.+\n?/, "").trim();

  return { heading, body };
}

/**
 * normalizeFrontMatter
 *
 * Coerces gray-matter data into the expected guide shape.
 *
 * @param data - Parsed YAML front matter.
 * @returns Normalized front matter object.
 */
function normalizeFrontMatter(data: Record<string, unknown>): GuideFrontMatter {
  const secondaryKeywords = Array.isArray(data.secondaryKeywords)
    ? data.secondaryKeywords.filter(
        (keyword): keyword is string => typeof keyword === "string",
      )
    : [];

  return {
    title: String(data.title ?? ""),
    metaTitle: String(data.metaTitle ?? data.title ?? ""),
    metaDescription: String(data.metaDescription ?? ""),
    slug: String(data.slug ?? ""),
    locale: String(data.locale ?? "es-CO"),
    published: data.published === true,
    publishedAt: String(data.publishedAt ?? ""),
    updatedAt: String(data.updatedAt ?? data.publishedAt ?? ""),
    author: String(data.author ?? "TruePhone"),
    primaryKeyword: String(data.primaryKeyword ?? ""),
    secondaryKeywords,
  };
}

/**
 * parseGuideFile
 *
 * Reads one markdown file and returns a parsed guide.
 *
 * @param filePath - Absolute path to the .md file.
 * @returns Parsed guide or null when front matter is invalid.
 */
function parseGuideFile(filePath: string): Guide | null {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontMatter = normalizeFrontMatter(
    data as Record<string, unknown>,
  );

  if (!frontMatter.slug || !frontMatter.title) {
    return null;
  }

  const withoutNotes = stripNotesSection(content);
  const { heading, body } = extractHeading(
    withoutNotes,
    frontMatter.title,
  );

  return {
    ...frontMatter,
    heading,
    content: body,
  };
}

/**
 * listGuideFilePaths
 *
 * Returns absolute paths for markdown files in content/guias.
 *
 * @returns Sorted guide file paths.
 */
function listGuideFilePaths(): string[] {
  if (!fs.existsSync(GUIDES_DIR)) {
    return [];
  }

  return fs
    .readdirSync(GUIDES_DIR)
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(GUIDES_DIR, name))
    .sort();
}

/**
 * getAllGuides
 *
 * Loads every guide markdown file, including unpublished drafts.
 *
 * @returns Guides sorted by publishedAt descending.
 * @calledBy getPublishedGuides, getGuideBySlug
 */
export function getAllGuides(): Guide[] {
  return listGuideFilePaths()
    .map(parseGuideFile)
    .filter((guide): guide is Guide => guide !== null)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * getPublishedGuides
 *
 * Returns only guides with `published: true`.
 *
 * @returns Published guides for index, sitemap, and static params.
 * @calledBy /guias pages, sitemap
 */
export function getPublishedGuides(): Guide[] {
  return getAllGuides().filter((guide) => guide.published);
}

/**
 * getPublishedGuideSummaries
 *
 * Lean list payload for the /guias index.
 *
 * @returns Summary rows for published guides.
 */
export function getPublishedGuideSummaries(): GuideSummary[] {
  return getPublishedGuides().map(
    ({ slug, title, metaDescription, publishedAt, updatedAt }) => ({
      slug,
      title,
      metaDescription,
      publishedAt,
      updatedAt,
    }),
  );
}

/**
 * getGuideBySlug
 *
 * Finds a published guide by slug.
 *
 * @param slug - URL slug from /guias/[slug].
 * @returns Matching guide or null when missing/unpublished.
 * @calledBy /guias/[slug] page
 */
export function getGuideBySlug(slug: string): Guide | null {
  const guide = getAllGuides().find((entry) => entry.slug === slug);

  if (!guide || !guide.published) {
    return null;
  }

  return guide;
}
