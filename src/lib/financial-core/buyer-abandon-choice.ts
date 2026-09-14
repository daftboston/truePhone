/**
 * @file buyer-abandon-choice.ts
 * @description Pure rules for the buyer refund vs 8% loyalty choice after seller cancel.
 * @dependencies @prisma/client FeeEntitlementStatus
 */

import type { FeeEntitlementStatus } from "@prisma/client";

export type LoyaltyChoiceEntitlement = {
  status: FeeEntitlementStatus;
  expiresAt: Date | null;
};

/**
 * buyerCanChooseRefundOrLoyalty
 *
 * True when the buyer still has an ACTIVE (non-expired) 8% entitlement on a
 * cancelled source order. Refund remains available until they use it or
 * explicitly choose refund (docs/FINANCIAL_MODEL.md §5.2).
 *
 * @param input.orderStatus - Order status enum string.
 * @param input.isBuyer - Whether the viewer is the buyer.
 * @param input.entitlement - Source-order fee entitlement, or null.
 * @param input.now - Optional clock; defaults to Date.now.
 * @returns Whether the choice UI should render.
 * @calledBy OrderDetailView, OrderCard
 */
export function buyerCanChooseRefundOrLoyalty(input: {
  orderStatus: string;
  isBuyer: boolean;
  entitlement: LoyaltyChoiceEntitlement | null | undefined;
  now?: Date;
}): boolean {
  if (!input.isBuyer) return false;
  if (input.orderStatus !== "CANCELLED") return false;
  const entitlement = input.entitlement;
  if (!entitlement || entitlement.status !== "ACTIVE") return false;
  if (entitlement.expiresAt) {
    const now = input.now ?? new Date();
    if (entitlement.expiresAt <= now) return false;
  }
  return true;
}
