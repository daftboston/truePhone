/**
 * @file acceptance.ts
 * @description Ley 527 electronic acceptance persistence (server-only).
 *   Import from this module in Server Actions / Route Handlers — not from @/lib/legal.
 * @dependencies @/lib/db, @/lib/legal/constants, @prisma/client
 */

import type { LegalAcceptanceSource } from "@prisma/client";

import { prisma } from "@/lib/db";
import { LEGAL_LAST_UPDATED_ISO } from "@/lib/legal/constants";

/** Cookie set before OAuth signup redirect; cleared after recording acceptance. */
export const LEGAL_SIGNUP_PENDING_COOKIE = "tp_legal_signup_pending";

/**
 * currentLegalVersionIds
 *
 * Returns version identifiers for terms and privacy used in audit rows.
 *
 * @returns ISO date strings for both documents (same stamp until split versions exist).
 * @calledBy recordLegalAcceptance, acceptance validation
 */
export function currentLegalVersionIds() {
  return {
    termsVersionId: LEGAL_LAST_UPDATED_ISO,
    privacyVersionId: LEGAL_LAST_UPDATED_ISO,
  };
}

/**
 * isLegalAcceptedValue
 *
 * Parses checkbox / boolean acceptance from form data or explicit flags.
 *
 * @param value - FormData, boolean, or string literal.
 * @returns True when the user explicitly accepted.
 * @calledBy registerAction, startCheckoutAction, confirmMockPaymentAction
 */
export function isLegalAcceptedValue(
  value: FormData | boolean | string | null | undefined,
): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (value instanceof FormData) {
    const raw = value.get("legalAccepted");
    return raw === "on" || raw === "true" || raw === "1";
  }
  return value === "on" || value === "true" || value === "1";
}

/**
 * recordLegalAcceptance
 *
 * Persists an electronic acceptance event for the current legal document versions.
 *
 * @param input.userId - Profile id of the accepting user.
 * @param input.source - signup or checkout.
 * @param input.ipAddress - Optional client IP from request headers.
 * @param input.userAgent - Optional User-Agent from request headers.
 * @returns Created LegalAcceptance row.
 * @calledBy registerAction, startCheckoutAction, auth callback
 */
export async function recordLegalAcceptance(input: {
  userId: string;
  source: LegalAcceptanceSource;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const versions = currentLegalVersionIds();
  return prisma.legalAcceptance.create({
    data: {
      userId: input.userId,
      termsVersionId: versions.termsVersionId,
      privacyVersionId: versions.privacyVersionId,
      source: input.source,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
