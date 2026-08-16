/**
 * @file recently-viewed.ts
 * @description Browser localStorage helpers for recently viewed listings.
 * @dependencies browser localStorage
 */

const STORAGE_KEY = "truephone:recently-viewed";
const MAX_ITEMS = 8;

/**
 * V1: client-only history (localStorage). No per-user server table yet —
 * fine for marketplace discovery; server-backed history can wait until
 * post-MVP personalization.
 */
export type RecentlyViewedItem = {
  slug: string;
  title: string;
  viewedAt: number;
};

/**
 * readRecentlyViewed
 *
 * Reads and validates recently viewed items from localStorage.
 *
 * @returns Array of RecentlyViewedItem; empty when unavailable or invalid.
 * @calledBy Recently viewed UI widgets
 */
export function readRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentlyViewedItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.slug === "string" &&
        typeof item.title === "string" &&
        typeof item.viewedAt === "number",
    );
  } catch {
    return [];
  }
}

/**
 * recordRecentlyViewed
 *
 * Prepends a listing view and trims to MAX_ITEMS in localStorage.
 *
 * @param slug - Listing public slug.
 * @param title - Display title at view time.
 * @returns void; no-op on server or quota failures.
 * @calledBy Listing detail client effects
 */
export function recordRecentlyViewed(slug: string, title: string) {
  if (typeof window === "undefined") return;
  const next: RecentlyViewedItem[] = [
    { slug, title, viewedAt: Date.now() },
    ...readRecentlyViewed().filter((item) => item.slug !== slug),
  ].slice(0, MAX_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota / private mode failures.
  }
}
