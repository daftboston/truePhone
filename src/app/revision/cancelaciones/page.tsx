/**
 * @file page.tsx
 * @description Preserves the former cancellation queue URL by redirecting to order support.
 * @dependencies next/navigation
 */

import { redirect } from "next/navigation";

/**
 * LegacyCancellationQueueRedirect
 *
 * Redirects stale ops links to the request-backed order-support queue.
 *
 * @returns Never; redirects to the canonical queue.
 */
export default function LegacyCancellationQueueRedirect() {
  redirect("/revision/soporte-pedidos?tab=pendientes");
}
