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
const ISO_DATE_PREFIX_PATTERN = /^(\d{4}-\d{2}-\d{2})/;

/**
 * coerceGuideDate
 *
 * Normalizes gray-matter date values to `YYYY-MM-DD` strings.
 *
 * @param value - YAML date (Date), ISO string, or empty.
 * @param fallback - Value when `value` is missing or invalid.
 * @returns ISO date prefix suitable for `formatGuideDate`.
 */
function coerceGuideDate(value: unknown, fallback = ""): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const match = trimmed.match(ISO_DATE_PREFIX_PATTERN);

    return match?.[1] ?? trimmed;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString().slice(0, 10);
  }

  return fallback;
}

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
 * stripBodyH1
 *
 * Removes a leading markdown H1 from the body when it duplicates front matter.
 *
 * @param content - Markdown body after notes are stripped.
 * @returns Body without a leading `#` line.
 */
function stripBodyH1(content: string): string {
  return content.replace(/^#\s+.+\n?/, "").trim();
}

/**
 * resolveHeading
 *
 * Resolves display H1 and body using `h1` front matter, body `#`, or `title`.
 *
 * @param content - Markdown body after notes are stripped.
 * @param options.h1 - Optional `h1` from front matter (shape A).
 * @param options.title - Front matter `title` fallback.
 * @returns Heading text and markdown body without a duplicate H1.
 */
function resolveHeading(
  content: string,
  options: { h1?: string; title: string },
): { heading: string; body: string } {
  if (options.h1) {
    return {
      heading: options.h1,
      body: stripBodyH1(content),
    };
  }

  const match = content.match(/^#\s+(.+)$/m);

  if (!match) {
    return { heading: options.title, body: content.trim() };
  }

  return {
    heading: match[1].trim(),
    body: stripBodyH1(content),
  };
}

/**
 * normalizeFrontMatter
 *
 * Coerces gray-matter data into the expected guide shape.
 *
 * @param data - Parsed YAML front matter.
 * @returns Normalized front matter object.
 */
function normalizeFrontMatter(
  data: Record<string, unknown>,
): GuideFrontMatter & { h1?: string } {
  const secondaryKeywords = Array.isArray(data.secondaryKeywords)
    ? data.secondaryKeywords.filter(
        (keyword): keyword is string => typeof keyword === "string",
      )
    : [];

  const h1 =
    typeof data.h1 === "string" && data.h1.trim().length > 0
      ? data.h1.trim()
      : undefined;

  const coverImage =
    typeof data.coverImage === "string" && data.coverImage.trim().length > 0
      ? data.coverImage.trim()
      : undefined;

  const publishedAt = coerceGuideDate(data.publishedAt);
  const updatedAt = coerceGuideDate(data.updatedAt, publishedAt);

  return {
    title: String(data.title ?? ""),
    metaTitle: String(data.metaTitle ?? data.title ?? ""),
    metaDescription: String(data.metaDescription ?? data.description ?? ""),
    slug: String(data.slug ?? ""),
    locale: String(data.locale ?? "es-CO"),
    published: data.published !== false,
    publishedAt,
    updatedAt,
    author: String(data.author ?? "TruePhone"),
    primaryKeyword: String(data.primaryKeyword ?? ""),
    secondaryKeywords,
    h1,
    coverImage,
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
  const normalized = normalizeFrontMatter(data as Record<string, unknown>);
  const { h1, ...frontMatter } = normalized;

  if (!frontMatter.slug || !frontMatter.title) {
    return null;
  }

  const withoutNotes = stripNotesSection(content);
  const { heading, body } = resolveHeading(withoutNotes, {
    h1,
    title: frontMatter.title,
  });

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
    ({ slug, heading, metaDescription, publishedAt, updatedAt }) => ({
      slug,
      heading,
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
