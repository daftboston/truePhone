/**
 * @file listing-views.ts
 * @description Records unique listing views for ops analytics (Phase 15).
 * @dependencies node:crypto, @prisma/client, @/lib/db
 */

import { createHash } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

const BOT_USER_AGENT =
  /bot|crawler|spider|crawling|preview|facebookexternalhit|whatsapp|slackbot|telegram|discordbot|embedly|quora|pinterest|ahrefs|semrush|bytespider|gptbot|claudebot|applebot|bingpreview|duckduckbot/i;

export type ListingViewSkipReason = "seller" | "bot";

/**
 * utcDateOnly
 *
 * Truncates a timestamp to a UTC calendar date for daily unique-view keys.
 *
 * @param date - Instant to truncate.
 * @returns UTC midnight Date for that calendar day.
 * @calledBy listingViewDedupeKey consumers, recordListingView
 */
export function utcDateOnly(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * hashListingVisitor
 *
 * Builds a stable guest fingerprint from IP and user-agent.
 *
 * @param ip - Client IP (first x-forwarded-for hop or unknown).
 * @param userAgent - Request User-Agent header.
 * @returns 32-character SHA-256 hex prefix.
 * @calledBy recordListingView
 */
export function hashListingVisitor(ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(`${ip.trim()}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * listingViewDedupeKey
 *
 * One key per signed-in profile or guest fingerprint.
 *
 * @param input.viewerId - Profile UUID when authenticated.
 * @param input.visitorHash - Guest hash from hashListingVisitor.
 * @returns Dedupe key stored on ListingViewEvent.
 * @calledBy recordListingView, listing-views.test.ts
 */
export function listingViewDedupeKey(input: {
  viewerId: string | null;
  visitorHash: string;
}): string {
  if (input.viewerId) {
    return `u:${input.viewerId}`;
  }
  return `h:${input.visitorHash}`;
}

/**
 * listingViewSkipReason
 *
 * Returns why a request must not count as a marketplace view.
 * Seller self-views and crawler/preview agents are skipped; staff refreshes
 * are allowed but collapsed by the daily unique key.
 *
 * @param input.sellerId - Listing owner profile UUID.
 * @param input.viewerId - Current profile UUID, or null for guests.
 * @param input.userAgent - Request User-Agent header.
 * @returns Skip reason, or null when the view may be recorded.
 * @calledBy recordListingView, listing-views.test.ts
 */
export function listingViewSkipReason(input: {
  sellerId: string;
  viewerId: string | null;
  userAgent: string;
}): ListingViewSkipReason | null {
  if (input.viewerId && input.viewerId === input.sellerId) {
    return "seller";
  }
  if (BOT_USER_AGENT.test(input.userAgent)) {
    return "bot";
  }
  return null;
}

/**
 * listingViewRequestMeta
 *
 * Reads IP and User-Agent from incoming headers for view fingerprints.
 *
 * @param headerStore - Next.js request headers.
 * @returns IP (first forwarded hop) and raw User-Agent.
 * @calledBy PublicListingPage
 */
export function listingViewRequestMeta(headerStore: Headers): {
  ip: string;
  userAgent: string;
} {
  const forwarded = headerStore.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip")?.trim() ||
    "unknown";
  return {
    ip,
    userAgent: headerStore.get("user-agent") ?? "",
  };
}

/**
 * isUniqueConstraintError
 *
 * Detects Prisma unique-constraint failures across driver-adapter wrappers.
 *
 * @param error - Unknown thrown value.
 * @returns True when the error is a unique conflict.
 * @calledBy recordListingView
 */
function isUniqueConstraintError(error: unknown): boolean {
  let current: unknown = error;
  for (let i = 0; i < 4 && current; i += 1) {
    const code = (current as { code?: string }).code;
    if (code === "P2002" || code === "23505") {
      return true;
    }
    const message = String((current as { message?: string }).message ?? "");
    if (
      message.includes("Unique constraint") ||
      message.includes("listing_view_events_listingId_dedupeKey_viewedOn")
    ) {
      return true;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

/**
 * recordListingView
 *
 * Inserts one ListingViewEvent per visitor per listing per UTC day and
 * increments Listing.views only when the insert succeeds. Tracking failures
 * never fail the listing page.
 *
 * @param input.listingId - Published listing UUID.
 * @param input.sellerId - Listing owner; self-views are ignored.
 * @param input.viewerId - Authenticated profile UUID, or null.
 * @param input.ip - Client IP used for guest fingerprints.
 * @param input.userAgent - User-Agent used for bot skip and guest hash.
 * @param input.now - Optional clock for tests.
 * @returns Whether a new unique-visitor-day row was stored.
 * @calledBy PublicListingPage
 */
export async function recordListingView(input: {
  listingId: string;
  sellerId: string;
  viewerId: string | null;
  ip: string;
  userAgent: string;
  now?: Date;
}): Promise<{ recorded: boolean }> {
  if (
    listingViewSkipReason({
      sellerId: input.sellerId,
      viewerId: input.viewerId,
      userAgent: input.userAgent,
    })
  ) {
    return { recorded: false };
  }

  const now = input.now ?? new Date();
  const visitorHash = hashListingVisitor(input.ip, input.userAgent);
  const dedupeKey = listingViewDedupeKey({
    viewerId: input.viewerId,
    visitorHash,
  });
  const viewedOn = utcDateOnly(now);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.listingViewEvent.create({
        data: {
          listingId: input.listingId,
          viewerId: input.viewerId,
          dedupeKey,
          viewedOn,
        },
      });
      await tx.listing.update({
        where: { id: input.listingId },
        data: { views: { increment: 1 } },
      });
    });
    return { recorded: true };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { recorded: false };
    }
    console.error("recordListingView failed", error);
    return { recorded: false };
  }
}
