/**
 * @file request-meta.ts
 * @description Reads IP and User-Agent from request headers for legal audit trails.
 * @dependencies none
 */

/**
 * getRequestAuditMeta
 *
 * Extracts client IP (first forwarded hop) and User-Agent for acceptance records.
 *
 * @param headerStore - Next.js request headers or a Headers instance.
 * @returns IP and raw User-Agent strings.
 * @calledBy registerAction, startCheckoutAction, auth callback
 */
export function getRequestAuditMeta(headerStore: Headers): {
  ipAddress: string;
  userAgent: string;
} {
  const forwarded = headerStore.get("x-forwarded-for");
  const ipAddress =
    forwarded?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip")?.trim() ||
    "unknown";
  return {
    ipAddress,
    userAgent: headerStore.get("user-agent") ?? "",
  };
}
